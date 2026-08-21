import express from "express";
import { v4 as uuidv4 } from "uuid";
import Workspace from "../models/workspaces.js";
import Thread from "../models/threads.js";
import { ensureAuthenticated } from "../middleware/auth.js";
import Embedding from "../models/embeddings.js";
import Document from "../models/documents.js";
import Memory from "../models/memories.js";
import DocumentFile from "../models/documentFiles.js";
import RAGTest from "../models/ragTests.js";
import RAGExperiment from "../models/ragExperiments.js";
import ResponseEvaluation from "../models/responseEvaluations.js";
import ResponseMetric from "../models/responseMetrics.js";

const router = express.Router();

router.post("/", ensureAuthenticated, async (req, res) => {
    try {
        const { name, description = "" } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: "Workspace name is required."
            });
        }

        const workspace = await Workspace.create({
            workspaceId: uuidv4(),
            userId: req.user._id,
            name: name.trim(),
            description: description.trim()
        });

        res.status(201).json(workspace);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to create workspace."
        });
    }
});

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const workspaces = await Workspace
            .find({
                userId: req.user._id
            })
            .sort({
                updatedAt: -1
            });

        res.json(workspaces);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to fetch workspaces."
        });
    }
});

router.patch("/:workspaceId", ensureAuthenticated, async (req, res) => {
    try {
        const { name, description } = req.body;

        const workspace = await Workspace.findOne({
            workspaceId: req.params.workspaceId,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(404).json({
                error: "Workspace not found."
            });
        }

        if (name !== undefined) {
            workspace.name = name.trim();
        }

        if (description !== undefined) {
            workspace.description = description.trim();
        }

        workspace.updatedAt = new Date();

        await workspace.save();

        res.json(workspace);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to update workspace."
        });
    }
});

router.delete(
    "/:workspaceId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { workspaceId } = req.params;

            const workspace = await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

            if (!workspace) {
                return res.status(404).json({
                    error: "Workspace not found."
                });
            }

            const threads = await Thread.find({
                workspaceId,
                userId: req.user._id
            }).select("threadId");

            const threadIds = threads.map(
                thread => thread.threadId
            );

            if (threadIds.length > 0) {
                await Embedding.deleteMany({
                    threadId: {
                        $in: threadIds
                    }
                });

                await Memory.deleteMany({
                    threadId: {
                        $in: threadIds
                    }
                });

                await ResponseEvaluation.deleteMany({
                    workspaceId,
                    threadId: {
                        $in: threadIds
                    }
                });

                await ResponseMetric.deleteMany({
                    workspaceId,
                    threadId: {
                        $in: threadIds
                    }
                });

                await RAGTest.deleteMany({
                    workspaceId,
                    userId: req.user._id,
                    threadId: {
                        $in: threadIds
                    }
                });

                await RAGExperiment.deleteMany({
                    workspaceId,
                    userId: req.user._id,
                    threadId: {
                        $in: threadIds
                    }
                });
            }

            const documents = await Document.find({
                workspaceId
            }).select("documentId");

            const documentIds = documents.map(
                document => document.documentId
            );

            if (documentIds.length > 0) {
                await DocumentFile.deleteMany({
                    workspaceId,
                    documentId: {
                        $in: documentIds
                    }
                });
            }

            await Document.deleteMany({
                workspaceId
            });

            await Thread.deleteMany({
                workspaceId,
                userId: req.user._id
            });

            await Workspace.deleteOne({
                workspaceId,
                userId: req.user._id
            });

            res.status(200).json({
                message:
                    "Workspace and all associated data deleted successfully."
            });
        } catch (err) {
            console.error("Delete workspace error:", err);

            res.status(500).json({
                error: "Failed to delete workspace."
            });
        }
    }
);

export default router;