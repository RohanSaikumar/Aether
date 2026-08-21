import "./RAGExperiments.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { API_URL } from "./config.js";


const defaultRagConfig = {
    documentTopK: 5,
    documentThreshold: 0.5,
    memoryTopK: 5,
    memoryThreshold: 0.7,
    chatTopK: 5,
    chatThreshold: 0.6,
    queryRewriting: true
};

export default function RAGExperiments({ onBackToEvaluation = () => {} }) {
    const { currentWorkspaceId, currThreadID } = useContext(MyContext);

    const [experiments, setExperiments] = useState([]);
    const [name, setName] = useState("");
    const [config, setConfig] = useState(defaultRagConfig);
    const [currentRagConfig, setCurrentRagConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(null);
    const [applying, setApplying] = useState(null);
    const [error, setError] = useState(null);

    const fetchCurrentRagConfig = async () => {
        if (!currentWorkspaceId || !currThreadID) {
            setCurrentRagConfig(null);
            setConfigLoading(false);
            return;
        }

        try {
            setConfigLoading(true);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments/thread/${currThreadID}/config`,
                {
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to fetch thread config."
                );
            }

            setCurrentRagConfig(
                result.ragConfig || defaultRagConfig
            );
        } catch (err) {
            console.error(err);
            setCurrentRagConfig(defaultRagConfig);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchExperiments = async () => {
        if (!currentWorkspaceId || !currThreadID) {
            setExperiments([]);
            return;
        }

        try {
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments/thread/${currThreadID}`,
                {
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to fetch experiments."
                );
            }

            setExperiments(result);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setExperiments([]);
        }
    };

    useEffect(() => {
        fetchExperiments();
        fetchCurrentRagConfig();
    }, [currentWorkspaceId, currThreadID]);

    const updateConfig = (key, value) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const createExperiment = async () => {
        if (!name.trim() || !currentWorkspaceId || !currThreadID) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        workspaceId: currentWorkspaceId,
                        threadId: currThreadID,
                        name: name.trim(),
                        config
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to create experiment."
                );
            }

            setName("");
            await fetchExperiments();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const runExperiment = async experimentId => {
        try {
            setRunning(experimentId);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments/${experimentId}/run`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to run experiment."
                );
            }

            await fetchExperiments();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setRunning(null);
        }
    };

    const applyExperiment = async experimentId => {
        try {
            setApplying(experimentId);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments/${experimentId}/apply`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to apply experiment."
                );
            }

            setCurrentRagConfig(
                result.config || defaultRagConfig
            );

            await fetchCurrentRagConfig();
            await fetchExperiments();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setApplying(null);
        }
    };

    const deleteExperiment = async experimentId => {
        try {
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/experiments/${experimentId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to delete experiment."
                );
            }

            await fetchExperiments();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    if (!currentWorkspaceId || !currThreadID) {
        return (
            <div className="experimentsEmpty">
                <h1>RAG Experiments</h1>
                <p>
                    Open a chat thread to create and run RAG experiments.
                </p>
                <button onClick={onBackToEvaluation}>
                    Back to Evaluation
                </button>
            </div>
        );
    }

    return (
        <div className="experimentsPage">
            <div className="experimentsHeader">
                <button
                    className="experimentBackButton"
                    onClick={onBackToEvaluation}
                    type="button"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Evaluation
                </button>

                <h1>RAG Experiments</h1>

                <p>
                    Compare retrieval configurations and find what works
                    best for Aether in this thread.
                </p>
            </div>

            {error && (
                <div className="experimentError">
                    {error}
                </div>
            )}

            <div className="currentRagConfigCard">
                <div className="currentRagConfigHeader">
                    <div>
                        <h2>Active RAG Config</h2>
                        <p>
                            Currently used by Aether for this thread.
                        </p>
                    </div>

                    <span className="currentRagConfigBadge">
                        ACTIVE
                    </span>
                </div>

                {configLoading ? (
                    <div className="currentRagConfigLoading">
                        Loading current configuration...
                    </div>
                ) : (
                    <>
                        <div className="currentRagConfigGrid">
                            <div>
                                <span>Documents</span>
                                <strong>
                                    {currentRagConfig.documentTopK}
                                </strong>
                            </div>

                            <div>
                                <span>Document Threshold</span>
                                <strong>
                                    {currentRagConfig.documentThreshold}
                                </strong>
                            </div>

                            <div>
                                <span>Memories</span>
                                <strong>
                                    {currentRagConfig.memoryTopK}
                                </strong>
                            </div>

                            <div>
                                <span>Memory Threshold</span>
                                <strong>
                                    {currentRagConfig.memoryThreshold}
                                </strong>
                            </div>

                            <div>
                                <span>Chats</span>
                                <strong>
                                    {currentRagConfig.chatTopK}
                                </strong>
                            </div>

                            <div>
                                <span>Chat Threshold</span>
                                <strong>
                                    {currentRagConfig.chatThreshold}
                                </strong>
                            </div>

                            <div>
                                <span>Query Rewriting</span>
                                <strong>
                                    {currentRagConfig.queryRewriting
                                        ? "ON"
                                        : "OFF"}
                                </strong>
                            </div>
                        </div>

                        <p className="currentRagConfigHint">
                            To change it, create and run an experiment,
                            then click <strong>Apply</strong> on the
                            configuration you prefer.
                        </p>
                    </>
                )}
            </div>

            <div className="createExperimentCard">
                <h2>Create Experiment</h2>

                <input
                    type="text"
                    placeholder="Experiment name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <div className="experimentConfigGrid">
                    {[
                        ["documentTopK", "Document Top K", 1, 20, 1],
                        ["documentThreshold", "Document Threshold", 0, 1, 0.05],
                        ["memoryTopK", "Memory Top K", 1, 20, 1],
                        ["memoryThreshold", "Memory Threshold", 0, 1, 0.05],
                        ["chatTopK", "Chat Top K", 1, 20, 1],
                        ["chatThreshold", "Chat Threshold", 0, 1, 0.05]
                    ].map(([key, label, min, max, step]) => (
                        <label key={key}>
                            {label}

                            <input
                                type="number"
                                min={min}
                                max={max}
                                step={step}
                                value={config[key]}
                                onChange={e =>
                                    updateConfig(
                                        key,
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>
                    ))}
                </div>

                <label className="rewriteToggle">
                    <input
                        type="checkbox"
                        checked={config.queryRewriting}
                        onChange={e =>
                            updateConfig(
                                "queryRewriting",
                                e.target.checked
                            )
                        }
                    />
                    Query rewriting
                </label>

                <button
                    className="createExperimentButton"
                    onClick={createExperiment}
                    disabled={
                        loading ||
                        !name.trim() ||
                        !currThreadID
                    }
                    type="button"
                >
                    {loading
                        ? "Creating..."
                        : "Create Experiment"}
                </button>
            </div>

            <div className="experimentsSection">
                <div className="experimentsSectionHeader">
                    <h2>Experiments</h2>

                    <span>
                        {experiments.length} experiments
                    </span>
                </div>

                {experiments.length === 0 ? (
                    <div className="noExperiments">
                        No experiments created for this thread yet.
                    </div>
                ) : (
                    <div className="experimentList">
                        {experiments.map(experiment => {
                            const summary =
                                experiment.results?.summary;

                            return (
                                <div
                                    className="experimentCard"
                                    key={experiment.experimentId}
                                >
                                    <div className="experimentInfo">
                                        <h3>
                                            {experiment.name}
                                        </h3>

                                        <div className="experimentConfig">
                                            <span>
                                                Docs:{" "}
                                                {experiment.config.documentTopK} /{" "}
                                                {experiment.config.documentThreshold}
                                            </span>

                                            <span>
                                                Memory:{" "}
                                                {experiment.config.memoryTopK} /{" "}
                                                {experiment.config.memoryThreshold}
                                            </span>

                                            <span>
                                                Chats:{" "}
                                                {experiment.config.chatTopK} /{" "}
                                                {experiment.config.chatThreshold}
                                            </span>

                                            <span>
                                                Rewrite:{" "}
                                                {experiment.config.queryRewriting
                                                    ? "ON"
                                                    : "OFF"}
                                            </span>
                                        </div>

                                        {summary && (
                                            <div className="experimentResults">
                                                <span>
                                                    Score:{" "}
                                                    <strong>
                                                        {summary.overallScore ?? "—"}
                                                        /10
                                                    </strong>
                                                </span>

                                                <span>
                                                    Quality:{" "}
                                                    {summary.quality ?? "—"}
                                                </span>

                                                <span>
                                                    Faithfulness:{" "}
                                                    {summary.faithfulness ?? "—"}
                                                </span>

                                                <span>
                                                    Relevance:{" "}
                                                    {summary.relevance ?? "—"}
                                                </span>

                                                <span>
                                                    Retrieval:{" "}
                                                    {summary.retrieval ?? "—"}
                                                </span>

                                                <span>
                                                    Latency:{" "}
                                                    {summary.latencyMs ?? "—"}ms
                                                </span>

                                                <span>
                                                    Passed:{" "}
                                                    {summary.testsPassed ?? 0}/
                                                    {summary.totalTests ?? 0}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="experimentActions">
                                        <span className="experimentStatus">
                                            {experiment.isApplied
                                                ? "Applied"
                                                : experiment.status}
                                        </span>

                                        <button
                                            onClick={() =>
                                                runExperiment(
                                                    experiment.experimentId
                                                )
                                            }
                                            disabled={
                                                running ===
                                                    experiment.experimentId ||
                                                applying ===
                                                    experiment.experimentId
                                            }
                                            type="button"
                                        >
                                            <i className="fa-solid fa-play"></i>
                                            {running ===
                                            experiment.experimentId
                                                ? "Running..."
                                                : "Run"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                applyExperiment(
                                                    experiment.experimentId
                                                )
                                            }
                                            disabled={
                                                experiment.status !==
                                                    "completed" ||
                                                applying ===
                                                    experiment.experimentId ||
                                                running ===
                                                    experiment.experimentId
                                            }
                                            type="button"
                                        >
                                            <i className="fa-solid fa-check"></i>
                                            {applying ===
                                            experiment.experimentId
                                                ? "Applying..."
                                                : experiment.isApplied
                                                    ? "Applied"
                                                    : "Apply"}
                                        </button>

                                        <button
                                            className="deleteExperimentButton"
                                            onClick={() =>
                                                deleteExperiment(
                                                    experiment.experimentId
                                                )
                                            }
                                            type="button"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}