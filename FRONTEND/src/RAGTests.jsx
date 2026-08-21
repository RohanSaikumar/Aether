import "./RAGTests.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import { API_URL } from "./config.js";

export default function RAGTests({
    onBackToEvaluation = () => {}
}) {
    const {
        currentWorkspaceId,
        currThreadID
    } = useContext(MyContext);

    const [tests, setTests] = useState([]);
    const [question, setQuestion] = useState("");
    const [expectedAnswer, setExpectedAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(null);
    const [suiteRunning, setSuiteRunning] = useState(false);
    const [error, setError] = useState(null);
    const [suiteResult, setSuiteResult] = useState(null);

    // FETCH TESTS FOR CURRENT THREAD

    const fetchTests = async () => {
        if (!currentWorkspaceId || !currThreadID) {
            setTests([]);
            return;
        }

        try {
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/tests/thread/${currThreadID}`,
                {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const result = await response.json();

                throw new Error(
                    result.error ||
                    "Failed to fetch RAG tests."
                );
            }

            const result = await response.json();

            setTests(result);
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    // LOAD WHEN THREAD CHANGES

    useEffect(() => {
        setSuiteResult(null);
        setError(null);

        fetchTests();
    }, [
        currentWorkspaceId,
        currThreadID
    ]);

    // CREATE TEST

    const createTest = async () => {
        if (
            !question.trim() ||
            !expectedAnswer.trim() ||
            !currentWorkspaceId ||
            !currThreadID
        ) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/tests`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        workspaceId:
                            currentWorkspaceId,

                        threadId:
                            currThreadID,

                        question:
                            question.trim(),

                        expectedAnswer:
                            expectedAnswer.trim()
                    })
                }
            );

            if (!response.ok) {
                const result =
                    await response.json();

                throw new Error(
                    result.error ||
                    "Failed to create test."
                );
            }

            const test =
                await response.json();

            setTests(prev => [
                test,
                ...prev
            ]);

            setQuestion("");
            setExpectedAnswer("");

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // RUN SINGLE TEST

    const runTest = async testId => {
        try {
            setRunning(testId);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/tests/${testId}/run`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const result =
                    await response.json();

                throw new Error(
                    result.error ||
                    "Failed to run test."
                );
            }

            await fetchTests();

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setRunning(null);
        }
    };

    
    // RUN THREAD TEST SUITE

    const runSuite = async () => {
        if (
            !currentWorkspaceId ||
            !currThreadID ||
            tests.length === 0
        ) {
            return;
        }

        try {
            setSuiteRunning(true);
            setError(null);
            setSuiteResult(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/tests/thread/${currThreadID}/run`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const result =
                    await response.json();

                throw new Error(
                    result.error ||
                    "Failed to run test suite."
                );
            }

            const result =
                await response.json();

            setSuiteResult(result);

            await fetchTests();

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSuiteRunning(false);
        }
    };

    // DELETE TEST

    const deleteTest = async testId => {
        try {
            setError(null);

            const response = await fetch(
                `${API_URL}/api/evaluation/tests/${testId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const result =
                    await response.json();

                throw new Error(
                    result.error ||
                    "Failed to delete test."
                );
            }

            setTests(prev =>
                prev.filter(
                    test =>
                        test.testId !==
                        testId
                )
            );

        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    // NO THREAD

    if (
        !currentWorkspaceId ||
        !currThreadID
    ) {
        return (
            <div className="ragTestsEmpty">
                <h1>RAG Test Suite</h1>

                <p>
                    Open a chat thread to create
                    and run RAG tests.
                </p>

                <button
                    onClick={
                        onBackToEvaluation
                    }
                >
                    Back to Evaluation
                </button>
            </div>
        );
    }

    // PAGE

    return (
        <div className="ragTestsPage">

            <div className="ragTestsHeader">

                <div>

                    <button
                        className="ragBackButton"
                        onClick={
                            onBackToEvaluation
                        }
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Evaluation
                    </button>

                    <h1>
                        RAG Test Suite
                    </h1>

                    <p>
                        Create and run tests to
                        measure the reliability
                        of Aether's retrieval
                        pipeline for this thread.
                    </p>

                </div>

                <button
                    className="runSuiteButton"
                    onClick={runSuite}
                    disabled={
                        suiteRunning ||
                        tests.length === 0
                    }
                >
                    <i className="fa-solid fa-play"></i>

                    {suiteRunning
                        ? "Running..."
                        : "Run Test Suite"}
                </button>

            </div>

            {error && (
                <div className="ragTestError">
                    {error}
                </div>
            )}

            {suiteResult && (
                <div className="suiteResult">

                    <div>
                        <span>
                            Tests
                        </span>

                        <strong>
                            {suiteResult.totalTests}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Passed
                        </span>

                        <strong>
                            {suiteResult.passed}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Failed
                        </span>

                        <strong>
                            {suiteResult.failed}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Pass Rate
                        </span>

                        <strong>
                            {suiteResult.passRate}%
                        </strong>
                    </div>

                    <div>
                        <span>
                            Average Score
                        </span>

                        <strong>
                            {suiteResult.averageScore ?? "—"}
                            /10
                        </strong>
                    </div>

                </div>
            )}

            <div className="createTestCard">

                <h2>
                    Create Test
                </h2>

                <input
                    type="text"
                    placeholder="Question"
                    value={question}
                    onChange={e =>
                        setQuestion(
                            e.target.value
                        )
                    }
                />

                <textarea
                    placeholder="Expected answer"
                    value={expectedAnswer}
                    onChange={e =>
                        setExpectedAnswer(
                            e.target.value
                        )
                    }
                />

                <button
                    onClick={createTest}
                    disabled={
                        loading ||
                        !question.trim() ||
                        !expectedAnswer.trim() ||
                        !currThreadID
                    }
                >
                    {loading
                        ? "Creating..."
                        : "Add Test"}
                </button>

            </div>

            <div className="ragTestsSection">

                <div className="ragTestsSectionHeader">

                    <h2>
                        Test Cases
                    </h2>

                    <span>
                        {tests.length} tests
                    </span>

                </div>

                {tests.length === 0 ? (

                    <div className="noRagTests">
                        No tests created for
                        this thread yet.
                    </div>

                ) : (

                    <div className="ragTestList">

                        {tests.map(test => (

                            <div
                                className="ragTestCard"
                                key={test.testId}
                            >

                                <div className="ragTestContent">

                                    <h3>
                                        {test.question}
                                    </h3>

                                    <p>
                                        <strong>
                                            Expected:
                                        </strong>{" "}
                                        {test.expectedAnswer}
                                    </p>

                                    {test.actualAnswer && (
                                        <div className="ragTestLatestAnswer">

                                            <strong>
                                                Latest answer:
                                            </strong>

                                            <div className="ragTestAnswer">
                                                <ReactMarkdown>
                                                    {
                                                        test.actualAnswer
                                                    }
                                                </ReactMarkdown>
                                            </div>

                                        </div>
                                    )}

                                    {test.lastRunAt && (
                                        <div className="ragTestScores">

                                            <span>
                                                Quality:{" "}
                                                {test.quality ?? "—"}
                                            </span>

                                            <span>
                                                Faithfulness:{" "}
                                                {test.faithfulnessScore ?? "—"}
                                            </span>

                                            <span>
                                                Relevance:{" "}
                                                {test.relevanceScore ?? "—"}
                                            </span>

                                            <span>
                                                Retrieval:{" "}
                                                {test.retrievalScore ?? "—"}
                                            </span>

                                            <span
                                                className={
                                                    test.passed
                                                        ? "passed"
                                                        : "failed"
                                                }
                                            >
                                                {test.passed
                                                    ? "PASS"
                                                    : "FAIL"}
                                            </span>

                                        </div>
                                    )}

                                </div>

                                <div className="ragTestActions">

                                    <button
                                        onClick={() =>
                                            runTest(
                                                test.testId
                                            )
                                        }
                                        disabled={
                                            running ===
                                                test.testId ||
                                            suiteRunning
                                        }
                                    >
                                        <i className="fa-solid fa-play"></i>

                                        {running ===
                                        test.testId
                                            ? "Running..."
                                            : "Run"}
                                    </button>

                                    <button
                                        className="deleteTestButton"
                                        onClick={() =>
                                            deleteTest(
                                                test.testId
                                            )
                                        }
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}