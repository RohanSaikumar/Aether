import "./App.css";
import Sidebar from "./Sidebar.jsx";
import Chatwindow from "./Chatwindow.jsx";
import Evaluation from "./Evaluation.jsx";
import ThreadEvaluation from "./ThreadEvaluation.jsx";
import RAGTests from "./RAGTests.jsx";
import RAGExperiments from "./RAGExperiments.jsx";
import { MyContext } from "./MyContext";
import { useState, useEffect } from "react";
import { v1 as uuidv1 } from "uuid";
import Login from "./components/Login";
import Register from "./components/Register";
import LoadingScreen from "./LoadingScreen.jsx";
import { API_URL } from "./config.js";


function App() {
    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);
    const [currThreadID, setCurrThreadID] = useState(uuidv1());
    const [prevChats, setPrevChats] = useState([]);
    const [newChat, setNewChat] = useState(true);
    const [allThreads, setAllThreads] = useState([]);
    const [page, setPage] = useState("login");
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
    const [workspacePage, setWorkspacePage] = useState("chat");

    const getWorkspaces = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/workspace`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch workspaces");
            }

            setWorkspaces(await response.json());
        } catch (err) {
            console.error(err);
        }
    };

    const getAllThreads = async () => {
        try {
            if (!currentWorkspaceId) {
                setAllThreads([]);
                return;
            }

            const response = await fetch(
                `${API_URL}/api/thread?workspaceId=${currentWorkspaceId}`,
                { credentials: "include" }
            );

            const res = await response.json();

            setAllThreads(
                res.map(thread => ({
                    threadId: thread.threadId,
                    title: thread.title
                }))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const getDocuments = async () => {
        try {
            if (!currentWorkspaceId) {
                setDocuments([]);
                return;
            }

            const response = await fetch(
                `${API_URL}/api/document?workspaceId=${currentWorkspaceId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch documents");
            }

            setDocuments(await response.json());
        } catch (err) {
            console.error(err);
        }
    };

    const openThread = () => {
        setWorkspacePage("chat");
    };

    const openWorkspaceEvaluation = () => {
        setWorkspacePage("evaluation");
    };

    const openRAGExperiments = () => {
        setWorkspacePage("ragExperiments");
    };

    const providerValues = {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadID,
        setCurrThreadID,
        prevChats,
        setPrevChats,
        newChat,
        setNewChat,
        allThreads,
        setAllThreads,
        getAllThreads,
        page,
        setPage,
        workspaces,
        setWorkspaces,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        getWorkspaces,
        documents,
        setDocuments,
        getDocuments
    };

    useEffect(() => {
        async function checkLogin() {
            try {
                const response = await fetch(
                    `${API_URL}/api/auth/me`,
                    { credentials: "include" }
                );

                setPage(response.ok ? "chat" : "login");
            } catch (err) {
                console.error(err);
                setPage("login");
            }

            setLoading(false);
        }

        checkLogin();
    }, []);

    useEffect(() => {
        if (page === "chat") {
            getWorkspaces();
        }
    }, [page]);

    useEffect(() => {
        if (currentWorkspaceId) {
            getAllThreads();
            getDocuments();
        } else {
            setAllThreads([]);
            setDocuments([]);
        }

        setCurrThreadID(uuidv1());
        setPrevChats([]);
        setReply(null);
        setPrompt("");
        setNewChat(true);
        setWorkspacePage("chat");
    }, [currentWorkspaceId]);

    useEffect(() => {
        if (page === "login") {
            setCurrentWorkspaceId(null);
            setAllThreads([]);
            setDocuments([]);
            setPrevChats([]);
            setPrompt("");
            setReply(null);
            setCurrThreadID(uuidv1());
            setNewChat(true);
            setWorkspacePage("chat");
            setWorkspaces([]);
        }
    }, [page]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <MyContext.Provider value={providerValues}>

            {page === "login" && <Login />}
            {page === "register" && <Register />}

            {page === "chat" && (
                <div className="app">

                    <Sidebar
                        onEvaluationClick={() =>
                            setWorkspacePage("evaluation")
                        }
                        onThreadClick={openThread}
                    />

                    {workspacePage === "evaluation" ? (

                        <Evaluation
                            onBackToChat={() =>
                                setWorkspacePage("chat")
                            }
                        />

                    ) : workspacePage === "threadEvaluation" ? (

                        <ThreadEvaluation
                            threadId={
                                newChat
                                    ? null
                                    : currThreadID
                            }
                            onBackToChat={() =>
                                setWorkspacePage("chat")
                            }
                            onOpenRAGTests={() =>
                                setWorkspacePage("ragTests")
                            }
                            onOpenRAGExperiments={() =>
                                setWorkspacePage(
                                    "ragExperiments"
                                )
                            }
                        />

                    ) : workspacePage === "ragTests" ? (

                        <RAGTests
                            threadId={
                                newChat
                                    ? null
                                    : currThreadID
                            }
                            onBackToEvaluation={() =>
                                setWorkspacePage(
                                    "threadEvaluation"
                                )
                            }
                        />

                    ) : workspacePage === "ragExperiments" ? (

                        <RAGExperiments
                            threadId={
                                newChat
                                    ? null
                                    : currThreadID
                            }
                            onBackToEvaluation={() =>
                                setWorkspacePage(
                                    "threadEvaluation"
                                )
                            }
                        />

                    ) : (

                        <Chatwindow
                            onOpenThreadEvaluation={() =>
                                setWorkspacePage(
                                    "threadEvaluation"
                                )
                            }
                            onOpenRAGExperiments={
                                openRAGExperiments
                            }
                            onOpenWorkspaceInfo={
                                openWorkspaceEvaluation
                            }
                        />

                    )}

                </div>
            )}

        </MyContext.Provider>
    );
}

export default App;