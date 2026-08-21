import express from "express";
import { v4 as uuidv4 } from "uuid";
import Workspace from "../models/workspaces.js";
import Thread from "../models/threads.js";
import RAGTest from "../models/ragTests.js";
import RAGExperiment from "../models/ragExperiments.js";
import { ensureAuthenticated } from "../middleware/auth.js";
import { runRAGExperiment } from "../utils/runRAGExperiment.js";

const router = express.Router();

router.post("/", ensureAuthenticated, async (req, res) => {
    try {
        const {
            workspaceId,
            threadId,
            name,
            config = {}
        } = req.body;

        if (
            !workspaceId ||
            !threadId ||
            !name?.trim()
        ) {
            return res.status(400).json({
                error:
                    "workspaceId, threadId and name are required."
            });
        }

        const workspace =
            await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

        if (!workspace) {
            return res.status(403).json({
                error:
                    "You do not have access to this workspace."
            });
        }

        const thread =
            await Thread.findOne({
                threadId,
                workspaceId,
                userId: req.user._id
            });

        if (!thread) {
            return res.status(403).json({
                error:
                    "You do not have access to this thread."
            });
        }

        const experimentConfig = {
            documentTopK:
                config.documentTopK ?? 5,
            documentThreshold:
                config.documentThreshold ?? 0.5,
            memoryTopK:
                config.memoryTopK ?? 5,
            memoryThreshold:
                config.memoryThreshold ?? 0.70,
            chatTopK:
                config.chatTopK ?? 5,
            chatThreshold:
                config.chatThreshold ?? 0.60,
            queryRewriting:
                config.queryRewriting ?? true
        };

        const experiment =
            await RAGExperiment.create({
                experimentId:
                    uuidv4(),
                userId:
                    req.user._id,
                workspaceId,
                threadId,
                name:
                    name.trim(),
                config:
                    experimentConfig,
                status:
                    "created",
                isApplied:
                    false
            });

        res.status(201).json(experiment);
    } catch (err) {
        console.error(
            "Create experiment error:",
            err
        );

        res.status(500).json({
            error:
                "Failed to create experiment."
        });
    }
});

router.get(
    "/thread/:threadId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const {
                threadId
            } = req.params;

            const thread =
                await Thread.findOne({
                    threadId,
                    userId: req.user._id
                });

            if (!thread) {
                return res.status(403).json({
                    error:
                        "You do not have access to this thread."
                });
            }

            const experiments =
                await RAGExperiment.find({
                    workspaceId:
                        thread.workspaceId,
                    threadId,
                    userId:
                        req.user._id
                })
                    .sort({
                        createdAt: -1
                    })
                    .lean();

            res.json(experiments);
        } catch (err) {
            console.error(
                "Get experiments error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to fetch experiments."
            });
        }
    }
);

router.get(
    "/thread/:threadId/config",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const {
                threadId
            } = req.params;

            const thread =
                await Thread.findOne({
                    threadId,
                    userId: req.user._id
                });

            if (!thread) {
                return res.status(403).json({
                    error:
                        "You do not have access to this thread."
                });
            }

            res.json({
                ragConfig:
                    thread.ragConfig
            });
        } catch (err) {
            console.error(
                "Get thread RAG config error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to fetch thread RAG config."
            });
        }
    }
);

router.post(
    "/:experimentId/run",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const {
                experimentId
            } = req.params;

            const experiment =
                await RAGExperiment.findOne({
                    experimentId,
                    userId: req.user._id
                });

            if (!experiment) {
                return res.status(404).json({
                    error:
                        "Experiment not found."
                });
            }

            const workspace =
                await Workspace.findOne({
                    workspaceId:
                        experiment.workspaceId,
                    userId:
                        req.user._id
                });

            if (!workspace) {
                return res.status(403).json({
                    error:
                        "You do not have access to this workspace."
                });
            }

            const thread =
                await Thread.findOne({
                    threadId:
                        experiment.threadId,
                    workspaceId:
                        experiment.workspaceId,
                    userId:
                        req.user._id
                });

            if (!thread) {
                return res.status(403).json({
                    error:
                        "You do not have access to this experiment's thread."
                });
            }

            const tests =
                await RAGTest.find({
                    workspaceId:
                        experiment.workspaceId,
                    threadId:
                        experiment.threadId,
                    userId:
                        req.user._id
                })
                    .sort({
                        createdAt: -1
                    });

            if (tests.length === 0) {
                return res.status(400).json({
                    error:
                        "No RAG tests are available for this thread."
                });
            }

            experiment.status =
                "running";

            experiment.updatedAt =
                new Date();

            await experiment.save();

            const result =
                await runRAGExperiment(
                    experiment,
                    tests
                );

            experiment.status =
                "completed";

            experiment.results = {
                summary:
                    result.summary,
                tests:
                    result.results,
                durationMs:
                    result.durationMs,
                completedAt:
                    new Date()
            };

            experiment.updatedAt =
                new Date();

            await experiment.save();

            res.json({
                experimentId:
                    experiment.experimentId,
                name:
                    experiment.name,
                threadId:
                    experiment.threadId,
                config:
                    experiment.config,
                status:
                    experiment.status,
                isApplied:
                    experiment.isApplied,
                summary:
                    result.summary,
                results:
                    result.results,
                durationMs:
                    result.durationMs
            });
        } catch (err) {
            console.error(
                "Run experiment error:",
                err
            );

            try {
                const experiment =
                    await RAGExperiment.findOne({
                        experimentId:
                            req.params.experimentId,
                        userId:
                            req.user._id
                    });

                if (experiment) {
                    experiment.status =
                        "failed";
                    experiment.updatedAt =
                        new Date();
                    await experiment.save();
                }
            } catch (updateErr) {
                console.error(
                    "Failed to update experiment status:",
                    updateErr
                );
            }

            res.status(500).json({
                error:
                    "Failed to run experiment."
            });
        }
    }
);

router.post(
    "/:experimentId/apply",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const {
                experimentId
            } = req.params;

            const experiment =
                await RAGExperiment.findOne({
                    experimentId,
                    userId: req.user._id
                });

            if (!experiment) {
                return res.status(404).json({
                    error:
                        "Experiment not found."
                });
            }

            if (
                experiment.status !==
                "completed"
            ) {
                return res.status(400).json({
                    error:
                        "Only completed experiments can be applied."
                });
            }

            const thread =
                await Thread.findOne({
                    threadId:
                        experiment.threadId,
                    workspaceId:
                        experiment.workspaceId,
                    userId:
                        req.user._id
                });

            if (!thread) {
                return res.status(403).json({
                    error:
                        "You do not have access to this experiment's thread."
                });
            }

            await RAGExperiment.updateMany(
                {
                    workspaceId:
                        experiment.workspaceId,
                    threadId:
                        experiment.threadId,
                    userId:
                        req.user._id,
                    experimentId: {
                        $ne:
                            experimentId
                    }
                },
                {
                    $set: {
                        isApplied:
                            false,
                        updatedAt:
                            new Date()
                    }
                }
            );

            thread.ragConfig = {
                ...experiment.config
            };

            thread.updatedAt =
                new Date();

            await thread.save();

            experiment.isApplied =
                true;

            experiment.updatedAt =
                new Date();

            await experiment.save();

            res.json({
                message:
                    "Experiment configuration applied successfully.",
                experimentId:
                    experiment.experimentId,
                config:
                    experiment.config,
                isApplied:
                    experiment.isApplied
            });
        } catch (err) {
            console.error(
                "Apply experiment error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to apply experiment configuration."
            });
        }
    }
);

router.delete(
    "/:experimentId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { experimentId } = req.params;

            const experiment = await RAGExperiment.findOne({
                experimentId,
                userId: req.user._id
            });

            if (!experiment) {
                return res.status(404).json({
                    error: "Experiment not found."
                });
            }

            const thread = await Thread.findOne({
                threadId: experiment.threadId,
                workspaceId: experiment.workspaceId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(403).json({
                    error: "You do not have access to this experiment's thread."
                });
            }

            await RAGExperiment.deleteOne({
                experimentId,
                userId: req.user._id,
                workspaceId: experiment.workspaceId,
                threadId: experiment.threadId
            });

            res.status(200).json({
                message: "Experiment deleted successfully."
            });
        } catch (err) {
            console.error("Delete experiment error:", err);

            res.status(500).json({
                error: "Failed to delete experiment."
            });
        }
    }
);

export default router;