import "./Sidebar.css";
import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { API_URL } from "./config.js";

export default function Sidebar({
    onEvaluationClick = () => {},
    onThreadClick = () => {}
}) {
    const {
        allThreads,
        setAllThreads,
        currThreadID,
        setCurrThreadID,
        setNewChat,
        setPrompt,
        setReply,
        setPrevChats,
        documents,
        setDocuments,
        workspaces,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        getWorkspaces
    } = useContext(MyContext);

    const [showWorkspaceForm, setShowWorkspaceForm] =
        useState(false);

    const [workspaceName, setWorkspaceName] =
        useState("");

    const [workspaceDescription, setWorkspaceDescription] =
        useState("");

    const createNewChat = () => {
        if (!currentWorkspaceId) return;

        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadID(uuidv1());
        setPrevChats([]);

        onThreadClick();
    };

    const changeThread = async threadId => {
        setCurrThreadID(threadId);
        onThreadClick();

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error("Failed to load thread");
            }

            const res = await response.json();

            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteThread = async threadId => {
        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            setAllThreads(prev =>
                prev.filter(
                    thread =>
                        thread.threadId !== threadId
                )
            );

            if (currThreadID === threadId) {
                createNewChat();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteDocument = async documentId => {
        try {
            if (!currentWorkspaceId) return;

            const response = await fetch(
                `${API_URL}/api/document/${documentId}?workspaceId=${currentWorkspaceId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const error = await response.json();

                throw new Error(
                    error.error ||
                    "Failed to delete document"
                );
            }

            setDocuments(prev =>
                prev.filter(
                    document =>
                        document._id !== documentId
                )
            );
        } catch (err) {
            console.error(
                "Document deletion error:",
                err
            );
        }
    };

    const openDocument = documentId => {
        if (!currentWorkspaceId) return;

        const url =
            `${API_URL}/api/document/${documentId}/file?workspaceId=${currentWorkspaceId}`;

        window.open(url, "_blank");
    };

    const changeWorkspace = workspaceId => {
        setCurrentWorkspaceId(workspaceId);
        setCurrThreadID(uuidv1());
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setNewChat(true);
        setAllThreads([]);
        setDocuments([]);
    };

    const deleteWorkspace = async workspaceId => {
        if (!workspaceId) return;

        const workspace = workspaces.find(
            item =>
                item.workspaceId === workspaceId
        );

        const confirmed = window.confirm(
            `Delete workspace "${workspace?.name || "this workspace"}"?\n\nThis will permanently delete all chats, documents, memories, embeddings, and uploaded files in this workspace.`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/api/workspace/${workspaceId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const error = await response.json();

                throw new Error(
                    error.error ||
                    "Failed to delete workspace"
                );
            }

            await getWorkspaces();

            if (
                currentWorkspaceId ===
                workspaceId
            ) {
                setCurrentWorkspaceId(null);
                setAllThreads([]);
                setDocuments([]);
                setPrevChats([]);
                setPrompt("");
                setReply(null);
                setCurrThreadID(uuidv1());
                setNewChat(true);
            }
        } catch (err) {
            console.error(
                "Workspace deletion error:",
                err
            );
        }
    };

    const createWorkspace = async () => {
        if (!workspaceName.trim()) return;

        try {
            const response = await fetch(
                `${API_URL}/api/workspace`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        name: workspaceName,
                        description:
                            workspaceDescription
                    })
                }
            );

            if (!response.ok) {
                const error =
                    await response.json();

                throw new Error(
                    error.error ||
                    "Failed to create workspace"
                );
            }

            const workspace =
                await response.json();

            await getWorkspaces();

            changeWorkspace(
                workspace.workspaceId
            );

            setWorkspaceName("");
            setWorkspaceDescription("");
            setShowWorkspaceForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <section className="sidebar">

                {/* AETHER LOGO */}
                <div className="aetherBrand">
                    <div className="aetherLogo">
                        A
                    </div>

                </div>

                {/* NEW CHAT */}
                <button
                    className="newChatButton"
                    onClick={createNewChat}
                    disabled={!currentWorkspaceId}
                >
                    <span className="newChatIcon">
                        <i className="fa-solid fa-pen-to-square"></i>
                    </span>

                    <span className="newChatText">
                        New chat
                    </span>

                    <span className="newChatShortcut">
                        <i className="fa-solid fa-plus"></i>
                    </span>
                </button>

                {/* WORKSPACES */}
                <div className="workspaceHeader">
                    <span>Workspaces</span>

                    <button
                        className="workspaceAdd"
                        onClick={() =>
                            setShowWorkspaceForm(true)
                        }
                    >
                        +
                    </button>
                </div>

                <div className="workspaceList">
                    {workspaces?.map(
                        workspace => (
                            <div
                                key={
                                    workspace.workspaceId
                                }
                                className={
                                    currentWorkspaceId ===
                                    workspace.workspaceId
                                        ? "workspaceItem active"
                                        : "workspaceItem"
                                }
                                onClick={() =>
                                    changeWorkspace(
                                        workspace.workspaceId
                                    )
                                }
                            >
                                <i className="fa-solid fa-folder"></i>

                                <span>
                                    {workspace.name}
                                </span>

                                <i
                                    className="fa-solid fa-trash workspaceDelete"
                                    onClick={e => {
                                        e.stopPropagation();

                                        deleteWorkspace(
                                            workspace.workspaceId
                                        );
                                    }}
                                ></i>
                            </div>
                        )
                    )}
                </div>

                {/* WORKSPACE EVALUATION */}
                {currentWorkspaceId && (
                    <button
                        className="evaluationButton"
                        onClick={
                            onEvaluationClick
                        }
                    >
                        <i className="fa-solid fa-chart-line"></i>

                        <span>
                            Workspace Evaluation
                        </span>
                    </button>
                )}

                {/* DOCUMENTS */}
                <div className="documentHeader">
                    Documents
                </div>

                <div className="documentList">
                    {documents?.map(
                        document => (
                            <div
                                className="documentItem"
                                key={document._id}
                                onClick={() =>
                                    openDocument(
                                        document._id
                                    )
                                }
                            >
                                <i className="fa-solid fa-file-lines"></i>

                                <span>
                                    {
                                        document.filename
                                    }
                                </span>

                                <i
                                    className="fa-solid fa-trash documentDelete"
                                    onClick={e => {
                                        e.stopPropagation();

                                        deleteDocument(
                                            document._id
                                        );
                                    }}
                                ></i>
                            </div>
                        )
                    )}
                </div>

                {/* CHATS */}
                <div className="chatHeader">
                    Chats
                </div>

                <ul className="history">
                    {allThreads?.map(
                        thread => (
                            <li
                                key={
                                    thread.threadId
                                }
                                onClick={() =>
                                    changeThread(
                                        thread.threadId
                                    )
                                }
                                className={
                                    currThreadID ===
                                    thread.threadId
                                        ? "highlighted"
                                        : ""
                                }
                            >
                                {thread.title}

                                <i
                                    className="fa-solid fa-trash"
                                    onClick={e => {
                                        e.stopPropagation();

                                        deleteThread(
                                            thread.threadId
                                        );
                                    }}
                                ></i>
                            </li>
                        )
                    )}
                </ul>

                <div className="sign">
                    <p>By Rohan Saikumar</p>
                </div>

            </section>

            {/* CREATE WORKSPACE MODAL */}
            {showWorkspaceForm &&
                createPortal(
                    <div className="workspaceModalOverlay">
                        <div className="workspaceModal">

                            <h3>
                                Create Workspace
                            </h3>

                            <input
                                type="text"
                                placeholder="Workspace name"
                                value={
                                    workspaceName
                                }
                                onChange={e =>
                                    setWorkspaceName(
                                        e.target.value
                                    )
                                }
                            />

                            <textarea
                                placeholder="Description (optional)"
                                value={
                                    workspaceDescription
                                }
                                onChange={e =>
                                    setWorkspaceDescription(
                                        e.target.value
                                    )
                                }
                            />

                            <div className="workspaceModalButtons">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWorkspaceForm(
                                            false
                                        );
                                        setWorkspaceName(
                                            ""
                                        );
                                        setWorkspaceDescription(
                                            ""
                                        );
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        createWorkspace
                                    }
                                >
                                    Create
                                </button>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}