import "./Evaluation.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { API_URL } from "./config.js";

export default function Evaluation({ onBackToChat = () => {} }) {
    const { currentWorkspaceId } = useContext(MyContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentWorkspaceId) {
            setData(null);
            setLoading(false);
            return;
        }

        const fetchEvaluation = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `${API_URL}/api/evaluation/workspace/${currentWorkspaceId}`,
                    { credentials: "include" }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch workspace evaluation."
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
    }, [currentWorkspaceId]);

    const backButton = (
        <button
            className="evaluationBackButton"
            onClick={onBackToChat}
            type="button"
        >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Chat
        </button>
    );

    if (!currentWorkspaceId) {
        return (
            <div className="evaluationEmpty">
                {backButton}
                <h1>Workspace Evaluation</h1>
                <p>Select a workspace to view its analytics.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="evaluationEmpty">
                {backButton}
                <h1>Workspace Evaluation</h1>
                <p>Loading workspace analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="evaluationEmpty">
                {backButton}
                <h1>Workspace Evaluation</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="evaluationPage">
            <div className="evaluationHeader">
                {backButton}

                <h1>Workspace Evaluation</h1>

                <p>
                    Monitor usage, performance, tokens, and cost
                    across this workspace.
                </p>
            </div>

            <div className="evaluationGrid">
                <div className="evaluationCard">
                    <span>Total Responses</span>
                    <strong>
                        {data.totalResponses || 0}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Evaluated Responses</span>
                    <strong>
                        {data.totalEvaluations || 0}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Avg. Latency</span>
                    <strong>
                        {(Number(data.averageLatencyMs || 0) / 1000).toFixed(2)}s
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Avg. Cost</span>
                    <strong>
                        ${Number(data.averageCostUsd || 0).toFixed(6)}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Total Cost</span>
                    <strong>
                        ${Number(data.totalCostUsd || 0).toFixed(5)}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Input Tokens</span>
                    <strong>
                        {Number(
                            data.totalInputTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Output Tokens</span>
                    <strong>
                        {Number(
                            data.totalOutputTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>

                <div className="evaluationCard">
                    <span>Total Tokens</span>
                    <strong>
                        {Number(
                            data.totalTokens || 0
                        ).toLocaleString()}
                    </strong>
                </div>
            </div>

            <div className="evaluationSection">
                <div className="sectionTitle">
                    Workspace Threads
                </div>

                {data.threadBreakdown?.length > 0 ? (
                    <div className="threadTableWrapper">
                        <table className="threadTable">
                            <thead>
                                <tr>
                                    <th>Thread</th>
                                    <th>Responses</th>
                                    <th>Evaluations</th>
                                    <th>Input Tokens</th>
                                    <th>Output Tokens</th>
                                    <th>Total Tokens</th>
                                    <th>Cost</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.threadBreakdown.map(thread => (
                                    <tr key={thread.threadId}>
                                        <td>
                                            <strong>
                                                {thread.title ||
                                                    "Untitled Thread"}
                                            </strong>
                                        </td>
                                        <td>{thread.responses || 0}</td>
                                        <td>{thread.evaluations || 0}</td>
                                        <td>
                                            {Number(
                                                thread.inputTokens || 0
                                            ).toLocaleString()}
                                        </td>
                                        <td>
                                            {Number(
                                                thread.outputTokens || 0
                                            ).toLocaleString()}
                                        </td>
                                        <td>
                                            {Number(
                                                thread.totalTokens || 0
                                            ).toLocaleString()}
                                        </td>
                                        <td>
                                            $
                                            {Number(
                                                thread.costUsd || 0
                                            ).toFixed(5)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="noEvaluations">
                        No thread data yet.
                    </div>
                )}
            </div>
        </div>
    );
}