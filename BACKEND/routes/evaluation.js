import express from "express";
import { ensureAuthenticated } from "../middleware/auth.js";
import Workspace from "../models/workspaces.js";
import Thread from "../models/threads.js";
import ResponseMetric from "../models/responseMetrics.js";
import ResponseEvaluation from "../models/responseEvaluations.js";
import RAGTest from "../models/ragTests.js";
import RAGExperiment from "../models/ragExperiments.js";

const router = express.Router();

const average = values => {
    const valid = values.filter(v => Number.isFinite(Number(v)));
    if (!valid.length) return 0;

    return valid.reduce(
        (sum, v) => sum + Number(v),
        0
    ) / valid.length;
};

const finite = values =>
    values.filter(v => Number.isFinite(Number(v)));

const getUsage = metrics => {
    let input = 0;
    let output = 0;
    let total = 0;
    let cost = 0;

    for (const metric of metrics) {
        input += Number(metric.inputTokens) || 0;
        output += Number(metric.outputTokens) || 0;

        const metricTotal = Number(metric.totalTokens);

        total += Number.isFinite(metricTotal)
            ? metricTotal
            : (Number(metric.inputTokens) || 0) +
              (Number(metric.outputTokens) || 0);

        cost += Number(metric.estimatedCostUsd) || 0;
    }

    return {
        input,
        output,
        total,
        cost
    };
};

const getRAGTestUsage = tests => {
    let input = 0;
    let output = 0;
    let total = 0;
    let cost = 0;

    for (const test of tests) {
        input += Number(test.inputTokens) || 0;
        output += Number(test.outputTokens) || 0;

        const testTotal = Number(test.totalTokens);

        total += Number.isFinite(testTotal)
            ? testTotal
            : (Number(test.inputTokens) || 0) +
              (Number(test.outputTokens) || 0);

        cost += Number(test.estimatedCostUsd) || 0;
    }

    return {
        input,
        output,
        total,
        cost
    };
};

const getExperimentUsage = experiments => {
    let input = 0;
    let output = 0;
    let total = 0;
    let cost = 0;

    for (const experiment of experiments) {
        for (const test of experiment.results?.tests || []) {
            input += Number(test.inputTokens) || 0;
            output += Number(test.outputTokens) || 0;

            const testTotal = Number(test.totalTokens);

            total += Number.isFinite(testTotal)
                ? testTotal
                : (Number(test.inputTokens) || 0) +
                  (Number(test.outputTokens) || 0);

            cost +=
                Number(test.estimatedCostUsd) || 0;
        }
    }

    return {
        input,
        output,
        total,
        cost
    };
};

const buildEvaluationStats = (
    metrics,
    evaluations,
    ragTests = [],
    experiments = []
) => {
    const quality = finite(
        evaluations.map(e => e.quality)
    );

    const faithfulness = finite(
        evaluations.map(e => e.faithfulness)
    );

    const relevance = finite(
        evaluations.map(e => e.relevance)
    );

    const retrieval = finite(
        evaluations.map(e => e.retrieval)
    );

    const latency = finite(
        metrics.map(m => m.latencyMs)
    );

    const responseUsage = getUsage(metrics);
    const testUsage = getRAGTestUsage(ragTests);
    const experimentUsage =
        getExperimentUsage(experiments);

    const totalInputTokens =
        responseUsage.input +
        testUsage.input +
        experimentUsage.input;

    const totalOutputTokens =
        responseUsage.output +
        testUsage.output +
        experimentUsage.output;

    const totalTokens =
        responseUsage.total +
        testUsage.total +
        experimentUsage.total;

    const totalCostUsd =
        responseUsage.cost +
        testUsage.cost +
        experimentUsage.cost;

    const totalUsageResponses =
        metrics.length +
        ragTests.filter(test => test.lastRunAt).length +
        experiments.filter(
            experiment =>
                experiment.status === "completed"
        ).length;

    return {
        totalResponses: metrics.length,
        totalUsageResponses,
        totalEvaluations: evaluations.length,

        averageQuality:
            Number(average(quality).toFixed(2)),

        averageFaithfulness:
            Number(
                average(faithfulness).toFixed(2)
            ),

        averageRelevance:
            Number(
                average(relevance).toFixed(2)
            ),

        averageRetrieval:
            Number(
                average(retrieval).toFixed(2)
            ),

        averageLatencyMs:
            Number(
                average(latency).toFixed(0)
            ),

        averageCostUsd:
            totalUsageResponses > 0
                ? Number(
                    (
                        totalCostUsd /
                        totalUsageResponses
                    ).toFixed(6)
                )
                : 0,

        totalCostUsd:
            Number(totalCostUsd.toFixed(6)),

        totalInputTokens,
        totalOutputTokens,
        totalTokens
    };
};

const getRecentEvaluations = (
    evaluations,
    metrics,
    threads = []
) =>
    evaluations.slice(0, 20).map(evaluation => {
        const metric = metrics.find(
            m =>
                m._id.toString() ===
                evaluation.metricId?.toString()
        );

        const thread = threads.find(
            t =>
                t.threadId ===
                evaluation.threadId
        );

        return {
            evaluationId: evaluation._id,
            metricId: evaluation.metricId,
            threadId: evaluation.threadId,
            threadTitle:
                thread?.title ||
                "Untitled Chat",
            quality: evaluation.quality,
            faithfulness:
                evaluation.faithfulness,
            relevance:
                evaluation.relevance,
            retrieval:
                evaluation.retrieval,
            reasoning:
                evaluation.reasoning,
            latencyMs:
                metric?.latencyMs ?? null,
            inputTokens:
                metric?.inputTokens ?? null,
            outputTokens:
                metric?.outputTokens ?? null,
            totalTokens:
                metric?.totalTokens ?? null,
            estimatedCostUsd:
                metric?.estimatedCostUsd ?? null,
            createdAt:
                evaluation.createdAt
        };
    });

const buildThreadRAGStats = (
    ragTests,
    experiments
) => {
    const testsRun = ragTests.filter(
        test => test.lastRunAt
    ).length;

    const testsPassed = ragTests.filter(
        test =>
            test.lastRunAt &&
            test.passed === true
    ).length;

    const testsFailed = ragTests.filter(
        test =>
            test.lastRunAt &&
            test.passed === false
    ).length;

    const experimentScores = experiments
        .map(
            e =>
                e.results?.summary
                    ?.overallScore
        )
        .filter(v =>
            Number.isFinite(Number(v))
        );

    const testUsage =
        getRAGTestUsage(ragTests);

    const experimentUsage =
        getExperimentUsage(experiments);

    return {
        totalTests: ragTests.length,
        testsRun,
        testsPassed,
        testsFailed,

        passRate: testsRun
            ? Number(
                (
                    (testsPassed /
                        testsRun) *
                    100
                ).toFixed(2)
            )
            : 0,

        totalExperiments:
            experiments.length,

        completedExperiments:
            experiments.filter(
                e =>
                    e.status ===
                    "completed"
            ).length,

        averageExperimentScore:
            Number(
                average(
                    experimentScores
                ).toFixed(2)
            ),

        testInputTokens:
            testUsage.input,

        testOutputTokens:
            testUsage.output,

        testTotalTokens:
            testUsage.total,

        testCostUsd:
            Number(
                testUsage.cost.toFixed(6)
            ),

        experimentInputTokens:
            experimentUsage.input,

        experimentOutputTokens:
            experimentUsage.output,

        experimentTotalTokens:
            experimentUsage.total,

        experimentCostUsd:
            Number(
                experimentUsage.cost.toFixed(6)
            )
    };
};

router.get(
    "/workspace/:workspaceId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { workspaceId } = req.params;

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

            const [
                metrics,
                evaluations,
                threads,
                ragTests,
                experiments
            ] = await Promise.all([
                ResponseMetric.find({
                    workspaceId
                })
                    .sort({ createdAt: -1 })
                    .lean(),

                ResponseEvaluation.find({
                    workspaceId
                })
                    .sort({ createdAt: -1 })
                    .lean(),

                Thread.find({
                    workspaceId,
                    userId: req.user._id
                })
                    .select(
                        "threadId title"
                    )
                    .lean(),

                RAGTest.find({
                    workspaceId,
                    userId: req.user._id,
                    lastRunAt: {
                        $ne: null
                    }
                })
                    .lean(),

                RAGExperiment.find({
                    workspaceId,
                    userId: req.user._id,
                    status: "completed"
                })
                    .lean()
            ]);

            const stats =
                buildEvaluationStats(
                    metrics,
                    evaluations,
                    ragTests,
                    experiments
                );

            const threadBreakdown =
                threads.map(thread => {
                    const threadMetrics =
                        metrics.filter(
                            metric =>
                                metric.threadId ===
                                thread.threadId
                        );

                    const threadEvaluations =
                        evaluations.filter(
                            evaluation =>
                                evaluation.threadId ===
                                thread.threadId
                        );

                    const threadTests =
                        ragTests.filter(
                            test =>
                                test.threadId ===
                                thread.threadId
                        );

                    const threadExperiments =
                        experiments.filter(
                            experiment =>
                                experiment.threadId ===
                                thread.threadId
                        );

                    const threadStats =
                        buildEvaluationStats(
                            threadMetrics,
                            threadEvaluations,
                            threadTests,
                            threadExperiments
                        );

                    return {
                        threadId:
                            thread.threadId,

                        title:
                            thread.title ||
                            "Untitled Chat",

                        responses:
                            threadStats.totalResponses,

                        evaluations:
                            threadStats.totalEvaluations,

                        inputTokens:
                            threadStats.totalInputTokens,

                        outputTokens:
                            threadStats.totalOutputTokens,

                        totalTokens:
                            threadStats.totalTokens,

                        costUsd:
                            threadStats.totalCostUsd
                    };
                });

            res.json({
                scope: "workspace",
                workspaceId,
                totalThreads:
                    threads.length,

                ...stats,

                threadBreakdown,

                recentEvaluations:
                    getRecentEvaluations(
                        evaluations,
                        metrics,
                        threads
                    )
            });
        } catch (err) {
            console.error(
                "Workspace evaluation error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to fetch workspace evaluation data."
            });
        }
    }
);

router.get(
    "/workspace/:workspaceId/thread/:threadId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const {
                workspaceId,
                threadId
            } = req.params;

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
                return res.status(404).json({
                    error:
                        "Thread not found."
                });
            }

            const [
                metrics,
                evaluations,
                ragTests,
                experiments
            ] = await Promise.all([
                ResponseMetric.find({
                    workspaceId,
                    threadId
                })
                    .sort({ createdAt: -1 })
                    .lean(),

                ResponseEvaluation.find({
                    workspaceId,
                    threadId
                })
                    .sort({ createdAt: -1 })
                    .lean(),

                RAGTest.find({
                    workspaceId,
                    threadId,
                    userId: req.user._id
                })
                    .sort({ createdAt: -1 })
                    .lean(),

                RAGExperiment.find({
                    workspaceId,
                    threadId,
                    userId: req.user._id
                })
                    .sort({ createdAt: -1 })
                    .lean()
            ]);

            const evaluationStats =
                buildEvaluationStats(
                    metrics,
                    evaluations,
                    ragTests.filter(
                        test => test.lastRunAt
                    ),
                    experiments.filter(
                        experiment =>
                            experiment.status ===
                            "completed"
                    )
                );

            const ragStats =
                buildThreadRAGStats(
                    ragTests,
                    experiments
                );

            res.json({
                scope: "thread",
                workspaceId,
                threadId,

                threadTitle:
                    thread.title ||
                    "Untitled Chat",

                ...evaluationStats,
                ...ragStats,

                recentEvaluations:
                    getRecentEvaluations(
                        evaluations,
                        metrics
                    )
            });
        } catch (err) {
            console.error(
                "Thread evaluation error:",
                err
            );

            res.status(500).json({
                error:
                    "Failed to fetch thread evaluation data."
            });
        }
    }
);

export default router;