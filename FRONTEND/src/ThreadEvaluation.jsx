import "./ThreadEvaluation.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { API_URL } from "./config.js";

export default function ThreadEvaluation({
    threadId,
    onBackToChat = () => {},
    onOpenRAGTests = () => {},
    onOpenRAGExperiments = () => {}
}) {
    const { currentWorkspaceId } = useContext(MyContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentWorkspaceId || !threadId) {
            setData(null);
            setLoading(false);
            return;
        }

        const fetchEvaluation = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `${API_URL}/api/evaluation/workspace/${currentWorkspaceId}/thread/${threadId}`,
                    { credentials: "include" }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch thread evaluation."
                    );
                }

                setData(await response.json());
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [currentWorkspaceId, threadId]);

    const backButton = (
        <button
            className="threadEvaluationBack"
            onClick={onBackToChat}
            type="button"
        >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Chat
        </button>
    );

    if (!threadId) {
        return (
            <div className="threadEvaluationEmpty">
                {backButton}
                <h1>Thread Evaluation</h1>
                <p>Open a chat to view its evaluation.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="threadEvaluationEmpty">
                {backButton}
                <h1>Thread Evaluation</h1>
                <p>Loading thread evaluation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="threadEvaluationEmpty">
                {backButton}
                <h1>Thread Evaluation</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="threadEvaluationPage">
            <div className="threadEvaluationHeader">
                {backButton}

                <h1>Thread Evaluation</h1>

                <p>
                    {data.threadTitle || "Untitled Thread"}
                </p>

                <div className="threadEvaluationActions">
                    <button
                        onClick={onOpenRAGTests}
                        type="button"
                    >
                        <i className="fa-solid fa-flask"></i>
                        RAG Test Suite
                    </button>

                    <button
                        onClick={onOpenRAGExperiments}
                        type="button"
                    >
                        <i className="fa-solid fa-vials"></i>
                        RAG Experiments
                    </button>
                </div>
            </div>

            <div className="threadEvaluationGrid">
                <div className="threadEvaluationCard">
                    <span>Responses</span>
                    <strong>{data.totalResponses || 0}</strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Evaluations</span>
                    <strong>{data.totalEvaluations || 0}</strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Avg. Latency</span>
                    <strong>
                        {(Number(data.averageLatencyMs || 0) / 1000).toFixed(2)}s
                    </strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Total Cost</span>
                    <strong>
                        ${Number(data.totalCostUsd || 0).toFixed(5)}
                    </strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Input Tokens</span>
                    <strong>
                        {Number(
                            data.totalInputTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Output Tokens</span>
                    <strong>
                        {Number(
                            data.totalOutputTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Total Tokens</span>
                    <strong>
                        {Number(
                            data.totalTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>

                <div className="threadEvaluationCard">
                    <span>Avg. Quality</span>
                    <strong>
                        {data.averageQuality ?? "—"}/10
                    </strong>
                </div>
            </div>

            <div className="threadEvaluationSection">
                <div className="threadSectionTitle">
                    RAG Testing
                </div>

                <div className="threadEvaluationGrid ragGrid">
                    <div className="threadEvaluationCard">
                        <span>Total Tests</span>
                        <strong>{data.totalTests || 0}</strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Tests Run</span>
                        <strong>{data.testsRun || 0}</strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Tests Passed</span>
                        <strong>{data.testsPassed || 0}</strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Pass Rate</span>
                        <strong>
                            {Number(data.passRate || 0).toFixed(1)}%
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Test Tokens</span>
                        <strong>
                            {Number(
                                data.testTotalTokens || 0
                            ).toLocaleString()}
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Test Cost</span>
                        <strong>
                            ${Number(
                                data.testCostUsd || 0
                            ).toFixed(5)}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="threadEvaluationSection">
                <div className="threadSectionTitle">
                    RAG Experiments
                </div>

                <div className="threadEvaluationGrid ragGrid">
                    <div className="threadEvaluationCard">
                        <span>Total Experiments</span>
                        <strong>
                            {data.totalExperiments || 0}
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Completed</span>
                        <strong>
                            {data.completedExperiments || 0}
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Avg. Score</span>
                        <strong>
                            {data.averageExperimentScore != null
                                ? `${data.averageExperimentScore}/10`
                                : "—"}
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Experiment Tokens</span>
                        <strong>
                            {Number(
                                data.experimentTotalTokens || 0
                            ).toLocaleString()}
                        </strong>
                    </div>

                    <div className="threadEvaluationCard">
                        <span>Experiment Cost</span>
                        <strong>
                            ${Number(
                                data.experimentCostUsd || 0
                            ).toFixed(5)}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="threadEvaluationSection">
                <div className="threadSectionTitle">
                    Recent Evaluations
                </div>

                {data.recentEvaluations?.length > 0 ? (
                    <div className="threadEvaluationList">
                        {data.recentEvaluations.map(evaluation => (
                            <div
                                className="threadEvaluationRow"
                                key={evaluation.evaluationId}
                            >
                                <div>
                                    <span>Quality</span>
                                    <strong>
                                        {evaluation.quality}/10
                                    </strong>
                                </div>

                                <div>
                                    <span>Faithfulness</span>
                                    <strong>
                                        {evaluation.faithfulness}/10
                                    </strong>
                                </div>

                                <div>
                                    <span>Relevance</span>
                                    <strong>
                                        {evaluation.relevance}/10
                                    </strong>
                                </div>

                                <div>
                                    <span>Retrieval</span>
                                    <strong>
                                        {evaluation.retrieval}/10
                                    </strong>
                                </div>

                                <div>
                                    <span>Latency</span>
                                    <strong>
                                        {evaluation.latencyMs
                                            ? `${(
                                                evaluation.latencyMs / 1000
                                            ).toFixed(2)}s`
                                            : "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Cost</span>
                                    <strong>
                                        {evaluation.estimatedCostUsd != null
                                            ? `$${Number(
                                                evaluation.estimatedCostUsd
                                            ).toFixed(5)}`
                                            : "—"}
                                    </strong>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="threadNoEvaluations">
                        No evaluations for this thread yet.
                    </div>
                )}
            </div>
        </div>
    );
}