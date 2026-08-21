import { runRAGTest } from "./runRAGTest.js";

export async function runRAGExperiment(experiment, tests) {
    const startTime = Date.now();
    const results = [];

    for (const test of tests) {
        try {
            const result = await runRAGTest(
                test,
                experiment.config
            );

            results.push({
                testId: test.testId,
                question: test.question,
                expectedAnswer: test.expectedAnswer,
                actualAnswer: result.actualAnswer,

                quality: result.quality ?? null,
                faithfulness:
                    result.faithfulnessScore ?? null,
                relevance:
                    result.relevanceScore ?? null,
                retrieval:
                    result.retrievalScore ?? null,
                overallScore:
                    result.overallScore ?? null,

                passed: result.passed ?? false,
                reasoning: result.reasoning ?? null,
                latencyMs: result.latencyMs ?? null,

                retrievedDocuments:
                    result.retrievedDocuments ?? 0,
                retrievedMemories:
                    result.retrievedMemories ?? 0,
                retrievedChats:
                    result.retrievedChats ?? 0,

                usage: result.usage ?? null,

                inputTokens:
                    result.inputTokens ?? null,

                outputTokens:
                    result.outputTokens ?? null,

                totalTokens:
                    result.totalTokens ?? null,

                estimatedCostUsd:
                    result.estimatedCostUsd ?? null
            });
        } catch (err) {
            console.error(
                `Experiment test failed: ${test.testId}`,
                err
            );

            results.push({
                testId: test.testId,
                question: test.question,
                passed: false,
                error: err.message
            });
        }
    }

    const successfulResults = results.filter(
        result =>
            Number.isFinite(result.overallScore)
    );

    const average = field => {
        const values = successfulResults
            .map(result => result[field])
            .filter(Number.isFinite);

        if (!values.length) return null;

        return Number(
            (
                values.reduce(
                    (sum, value) => sum + value,
                    0
                ) / values.length
            ).toFixed(2)
        );
    };

    const latencyValues = successfulResults
        .map(result => result.latencyMs)
        .filter(Number.isFinite);

    const averageLatency =
        latencyValues.length
            ? Math.round(
                latencyValues.reduce(
                    (sum, value) => sum + value,
                    0
                ) / latencyValues.length
            )
            : null;

    const testsPassed = successfulResults.filter(
        result => result.passed
    ).length;

    const totalTests = results.length;

    const totalInputTokens = results.reduce(
        (sum, result) =>
            sum + (Number(result.inputTokens) || 0),
        0
    );

    const totalOutputTokens = results.reduce(
        (sum, result) =>
            sum + (Number(result.outputTokens) || 0),
        0
    );

    const totalTokens = results.reduce(
        (sum, result) =>
            sum +
            (
                Number(result.totalTokens) ||
                (Number(result.inputTokens) || 0) +
                (Number(result.outputTokens) || 0)
            ),
        0
    );

    const totalCostUsd = results.reduce(
        (sum, result) =>
            sum +
            (Number(result.estimatedCostUsd) || 0),
        0
    );

    return {
        experimentId: experiment.experimentId,
        threadId: experiment.threadId,
        config: experiment.config,
        durationMs: Date.now() - startTime,

        summary: {
            totalTests,
            testsPassed,
            testsFailed:
                totalTests - testsPassed,

            passRate:
                totalTests > 0
                    ? Number(
                        (
                            (testsPassed /
                                totalTests) *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            quality: average("quality"),
            faithfulness: average("faithfulness"),
            relevance: average("relevance"),
            retrieval: average("retrieval"),
            overallScore: average("overallScore"),

            latencyMs: averageLatency,

            totalInputTokens,
            totalOutputTokens,
            totalTokens,
            totalCostUsd
        },

        results
    };
}