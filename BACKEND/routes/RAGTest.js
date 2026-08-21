import express from "express";
import { v4 as uuidv4 } from "uuid";
import { ensureAuthenticated } from "../middleware/auth.js";
import Workspace from "../models/workspaces.js";
import Thread from "../models/threads.js";
import RAGTest from "../models/ragTests.js";
import { runRAGTest } from "../utils/runRAGTest.js";

const router = express.Router();

router.post("/", ensureAuthenticated, async (req, res) => {
    try {
        const {
            workspaceId,
            threadId,
            question,
            expectedAnswer
        } = req.body;

        if (
            !workspaceId ||
            !threadId ||
            !question?.trim() ||
            !expectedAnswer?.trim()
        ) {
            return res.status(400).json({
                error:
                    "workspaceId, threadId, question and expectedAnswer are required."
            });
        }

        const workspace = await Workspace.findOne({
            workspaceId,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(403).json({
                error: "You do not have access to this workspace."
            });
        }

        const thread = await Thread.findOne({
            threadId,
            workspaceId,
            userId: req.user._id
        });

        if (!thread) {
            return res.status(403).json({
                error: "You do not have access to this thread."
            });
        }

        const test = await RAGTest.create({
            testId: uuidv4(),
            userId: req.user._id,
            workspaceId,
            threadId,
            question: question.trim(),
            expectedAnswer: expectedAnswer.trim()
        });

        res.status(201).json(test);
    } catch (err) {
        console.error("Create RAG test error:", err);

        res.status(500).json({
            error: "Failed to create RAG test."
        });
    }
});

router.get(
    "/thread/:threadId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { threadId } = req.params;

            const thread = await Thread.findOne({
                threadId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(403).json({
                    error: "You do not have access to this thread."
                });
            }

            const tests = await RAGTest.find({
                threadId,
                workspaceId: thread.workspaceId,
                userId: req.user._id
            }).sort({
                createdAt: -1
            });

            res.json(tests);
        } catch (err) {
            console.error("Get thread RAG tests error:", err);

            res.status(500).json({
                error: "Failed to fetch RAG tests."
            });
        }
    }
);

router.post(
    "/:testId/run",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { testId } = req.params;

            const test = await RAGTest.findOne({
                testId,
                userId: req.user._id
            });

            if (!test) {
                return res.status(404).json({
                    error: "RAG test not found."
                });
            }

            const thread = await Thread.findOne({
                threadId: test.threadId,
                workspaceId: test.workspaceId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(403).json({
                    error:
                        "You do not have access to this test's thread."
                });
            }

            const result = await runRAGTest(test);

            test.actualAnswer = result.actualAnswer;
            test.quality = result.quality ?? null;
            test.retrievalScore = result.retrievalScore ?? null;
            test.faithfulnessScore =
                result.faithfulnessScore ?? null;
            test.relevanceScore =
                result.relevanceScore ?? null;
            test.overallScore = result.overallScore ?? null;
            test.passed = result.passed ?? null;
            test.reasoning = result.reasoning ?? null;

            test.latencyMs = result.latencyMs ?? null;

            test.inputTokens =
                result.inputTokens ?? null;

            test.outputTokens =
                result.outputTokens ?? null;

            test.totalTokens =
                result.totalTokens ?? null;

            test.estimatedCostUsd =
                result.estimatedCostUsd ?? null;

            test.retrievedDocuments =
                result.retrievedDocuments ?? 0;

            test.retrievedMemories =
                result.retrievedMemories ?? 0;

            test.retrievedChats =
                result.retrievedChats ?? 0;

            test.lastRunAt = new Date();
            test.updatedAt = new Date();

            await test.save();

            res.json({
                testId: test.testId,
                question: test.question,
                expectedAnswer: test.expectedAnswer,
                ...result
            });
        } catch (err) {
            console.error("RAG test error:", err);

            res.status(500).json({
                error: "Failed to run RAG test."
            });
        }
    }
);

router.post(
    "/thread/:threadId/run",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { threadId } = req.params;

            const thread = await Thread.findOne({
                threadId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(403).json({
                    error: "You do not have access to this thread."
                });
            }

            const tests = await RAGTest.find({
                workspaceId: thread.workspaceId,
                threadId,
                userId: req.user._id
            }).sort({
                createdAt: -1
            });

            if (tests.length === 0) {
                return res.json({
                    message: "No RAG tests found for this thread.",
                    threadId,
                    totalTests: 0,
                    passed: 0,
                    failed: 0,
                    passRate: 0,
                    averageScore: null,
                    totalInputTokens: 0,
                    totalOutputTokens: 0,
                    totalTokens: 0,
                    totalCostUsd: 0,
                    results: []
                });
            }

            const results = [];

            for (const test of tests) {
                try {
                    const result = await runRAGTest(test);

                    test.actualAnswer =
                        result.actualAnswer;

                    test.quality =
                        result.quality ?? null;

                    test.retrievalScore =
                        result.retrievalScore ?? null;

                    test.faithfulnessScore =
                        result.faithfulnessScore ?? null;

                    test.relevanceScore =
                        result.relevanceScore ?? null;

                    test.overallScore =
                        result.overallScore ?? null;

                    test.passed =
                        result.passed ?? null;

                    test.reasoning =
                        result.reasoning ?? null;

                    test.latencyMs =
                        result.latencyMs ?? null;

                    test.inputTokens =
                        result.inputTokens ?? null;

                    test.outputTokens =
                        result.outputTokens ?? null;

                    test.totalTokens =
                        result.totalTokens ?? null;

                    test.estimatedCostUsd =
                        result.estimatedCostUsd ?? null;

                    test.retrievedDocuments =
                        result.retrievedDocuments ?? 0;

                    test.retrievedMemories =
                        result.retrievedMemories ?? 0;

                    test.retrievedChats =
                        result.retrievedChats ?? 0;

                    test.lastRunAt = new Date();
                    test.updatedAt = new Date();

                    await test.save();

                    results.push({
                        testId: test.testId,
                        question: test.question,
                        passed: result.passed,
                        quality: result.quality ?? null,
                        overallScore:
                            result.overallScore,
                        retrievalScore:
                            result.retrievalScore,
                        faithfulnessScore:
                            result.faithfulnessScore,
                        relevanceScore:
                            result.relevanceScore,
                        latencyMs:
                            result.latencyMs ?? null,
                        inputTokens:
                            result.inputTokens ?? null,
                        outputTokens:
                            result.outputTokens ?? null,
                        totalTokens:
                            result.totalTokens ?? null,
                        estimatedCostUsd:
                            result.estimatedCostUsd ?? null,
                        retrievedDocuments:
                            result.retrievedDocuments ?? 0,
                        retrievedMemories:
                            result.retrievedMemories ?? 0,
                        retrievedChats:
                            result.retrievedChats ?? 0,
                        usage:
                            result.usage ?? null
                    });
                } catch (err) {
                    console.error(
                        `Failed RAG test ${test.testId}:`,
                        err
                    );

                    results.push({
                        testId: test.testId,
                        question: test.question,
                        passed: false,
                        error: "Test execution failed."
                    });
                }
            }

            const passed = results.filter(
                result => result.passed
            ).length;

            const failed =
                results.length - passed;

            const average = field => {
                const values = results
                    .map(result => result[field])
                    .filter(Number.isFinite);

                if (values.length === 0) {
                    return null;
                }

                return Number(
                    (
                        values.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) / values.length
                    ).toFixed(2)
                );
            };

            const scoredResults = results.filter(
                result =>
                    Number.isFinite(
                        result.overallScore
                    )
            );

            const averageScore =
                scoredResults.length > 0
                    ? scoredResults.reduce(
                        (sum, result) =>
                            sum +
                            result.overallScore,
                        0
                    ) / scoredResults.length
                    : null;

            const latencyValues = results
                .map(result => result.latencyMs)
                .filter(Number.isFinite);

            const averageLatency =
                latencyValues.length > 0
                    ? Math.round(
                        latencyValues.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) / latencyValues.length
                    )
                    : null;

            const totalInputTokens =
                results.reduce(
                    (sum, result) =>
                        sum +
                        (Number(result.inputTokens) || 0),
                    0
                );

            const totalOutputTokens =
                results.reduce(
                    (sum, result) =>
                        sum +
                        (Number(result.outputTokens) || 0),
                    0
                );

            const totalTokens =
                results.reduce(
                    (sum, result) =>
                        sum +
                        (Number(result.totalTokens) || 0),
                    0
                );

            const totalCostUsd =
                results.reduce(
                    (sum, result) =>
                        sum +
                        (Number(
                            result.estimatedCostUsd
                        ) || 0),
                    0
                );

            res.json({
                threadId,
                totalTests: results.length,
                passed,
                failed,
                passRate:
                    results.length > 0
                        ? Number(
                            (
                                (passed /
                                    results.length) *
                                100
                            ).toFixed(2)
                        )
                        : 0,
                quality: average("quality"),
                faithfulness:
                    average("faithfulnessScore"),
                relevance:
                    average("relevanceScore"),
                retrieval:
                    average("retrievalScore"),
                averageScore:
                    averageScore !== null
                        ? Number(
                            averageScore.toFixed(2)
                        )
                        : null,
                averageLatencyMs:
                    averageLatency,
                totalInputTokens,
                totalOutputTokens,
                totalTokens,
                totalCostUsd,
                results
            });
        } catch (err) {
            console.error(
                "RAG test suite error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to run RAG test suite."
            });
        }
    }
);

router.delete(
    "/:testId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { testId } = req.params;

            const test = await RAGTest.findOne({
                testId,
                userId: req.user._id
            });

            if (!test) {
                return res.status(404).json({
                    error: "RAG test not found."
                });
            }

            const thread = await Thread.findOne({
                threadId: test.threadId,
                workspaceId: test.workspaceId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(403).json({
                    error: "You do not have access to this test's thread."
                });
            }

            await RAGTest.deleteOne({
                testId,
                userId: req.user._id,
                workspaceId: test.workspaceId,
                threadId: test.threadId
            });

            res.status(200).json({
                message: "RAG test deleted successfully."
            });
        } catch (err) {
            console.error("Delete RAG test error:", err);

            res.status(500).json({
                error: "Failed to delete RAG test."
            });
        }
    }
);

export default router;