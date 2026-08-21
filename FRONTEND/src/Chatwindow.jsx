import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { ScaleLoader } from "react-spinners";
import { useState, useContext, useRef } from "react";
import UploadButton from "./components/UploadButton.jsx";
import { uploadDocument } from "./services/documentApi.js";
import { API_URL } from "./config.js";

export default function ChatWindow({
    onOpenThreadEvaluation = () => {},
    onOpenRAGExperiments = () => {},
    onOpenWorkspaceInfo = () => {}
}) {
    const {
        getAllThreads,
        setNewChat,
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadID,
        prevChats,
        setPrevChats,
        setPage,
        currentWorkspaceId,
        setDocuments,
        newChat
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [webSearchEnabled, setWebSearchEnabled] =
        useState(false);
    const [showKnowledgeInfo, setShowKnowledgeInfo] =
        useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const recordingTimeoutRef = useRef(null);

    const MAX_RECORDING_SECONDS = 60;

    const transcribeRecording = async audioBlob => {
        setIsTranscribing(true);

        try {
            const formData = new FormData();

            formData.append(
                "audio",
                audioBlob,
                "recording.webm"
            );

            const response = await fetch(
                `${API_URL}/api/transcription`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

            if (!response.ok) {
                const errorText =
                    await response.text();

                throw new Error(
                    errorText ||
                        "Transcription failed."
                );
            }

            const data =
                await response.json();

            return data.text?.trim() || "";
        } catch (err) {
            console.error(
                "STT error:",
                err
            );

            return "";
        } finally {
            setIsTranscribing(false);
        }
    };

    const stopRecording = () => {
        return new Promise(resolve => {
            const recorder =
                mediaRecorderRef.current;

            if (
                !recorder ||
                recorder.state !== "recording"
            ) {
                resolve("");
                return;
            }

            recorder._stopResolve = resolve;
            recorder.stop();
        });
    };

    const getReply = async () => {
        if (
            loading ||
            !currentWorkspaceId
        ) {
            return;
        }

        let finalPrompt =
            prompt.trim();

        if (isRecording) {
            const transcript =
                await stopRecording();

            finalPrompt = [
                finalPrompt,
                transcript
            ]
                .filter(Boolean)
                .join(" ");
        }

        if (
            !finalPrompt &&
            selectedFiles.length === 0
        ) {
            return;
        }

        setLoading(true);
        setNewChat(false);

        try {
            let uploadedDocuments = [];
            let attachments = [];

            if (
                selectedFiles.length > 0
            ) {
                for (
                    const file of selectedFiles
                ) {
                    const uploaded =
                        await uploadDocument(
                            file,
                            currThreadID,
                            currentWorkspaceId
                        );

                    uploadedDocuments.push(
                        uploaded
                    );

                    if (
                        !uploaded.duplicate
                    ) {
                        setDocuments(
                            prevDocuments => [
                                {
                                    _id:
                                        uploaded.documentId,
                                    filename:
                                        uploaded.filename
                                },
                                ...prevDocuments
                            ]
                        );
                    }
                }

                attachments =
                    uploadedDocuments.map(
                        doc => ({
                            filename:
                                doc.filename,
                            documentId:
                                doc.documentId
                        })
                    );

                setSelectedFiles([]);
            }

            setPrevChats(prev => [
                ...prev,
                {
                    role: "user",
                    content: finalPrompt,
                    attachments
                }
            ]);

            const response =
                await fetch(
                    `${API_URL}/api/chat`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            message:
                                finalPrompt,
                            threadId:
                                currThreadID,
                            workspaceId:
                                currentWorkspaceId,
                            uploadedDocuments,
                            webSearchEnabled
                        })
                    }
                );

            if (!response.ok) {
                const errorText =
                    await response.text();

                throw new Error(
                    `Chat request failed: ${response.status} ${errorText}`
                );
            }

            if (!response.body) {
                throw new Error(
                    "Response body is not available."
                );
            }

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder();

            let streamedResponse = "";
            let buffer = "";

            while (true) {
                const {
                    value,
                    done
                } = await reader.read();

                if (done) {
                    break;
                }

                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );

                const events =
                    buffer.split("\n\n");

                buffer =
                    events.pop();

                for (
                    const event of events
                ) {
                    const lines =
                        event.split("\n");

                    for (
                        const line of lines
                    ) {
                        if (
                            !line.startsWith(
                                "data: "
                            )
                        ) {
                            continue;
                        }

                        try {
                            const data =
                                JSON.parse(
                                    line.slice(6)
                                );

                            if (data.chunk) {
                                streamedResponse +=
                                    data.chunk;

                                setReply(
                                    streamedResponse
                                );
                            }

                            if (data.error) {
                                throw new Error(
                                    data.error
                                );
                            }
                        } catch (err) {
                            console.error(
                                "Stream parsing error:",
                                err
                            );
                        }
                    }
                }
            }

            setPrevChats(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        streamedResponse
                }
            ]);

            setReply(null);
            setPrompt("");

            await getAllThreads();
        } catch (err) {
            console.error(
                "Chat error:",
                err
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = async () => {
        try {
            if (isRecording) {
                await stopRecording();
                return;
            }

            if (
                isTranscribing ||
                loading
            ) {
                return;
            }

            const stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: {
                            echoCancellation:
                                true,
                            noiseSuppression:
                                true,
                            autoGainControl:
                                true
                        }
                    });

            const mediaRecorder =
                new MediaRecorder(
                    stream
                );

            mediaRecorderRef.current =
                mediaRecorder;

            audioChunksRef.current =
                [];

            setRecordingTime(0);

            mediaRecorder.ondataavailable =
                event => {
                    if (
                        event.data &&
                        event.data.size > 0
                    ) {
                        audioChunksRef.current.push(
                            event.data
                        );
                    }
                };

            mediaRecorder.onstop =
                async () => {
                    setIsRecording(false);

                    clearInterval(
                        recordingTimerRef.current
                    );

                    clearTimeout(
                        recordingTimeoutRef.current
                    );

                    recordingTimerRef.current =
                        null;

                    recordingTimeoutRef.current =
                        null;

                    setRecordingTime(0);

                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                    const audioBlob =
                        new Blob(
                            audioChunksRef.current,
                            {
                                type:
                                    mediaRecorder.mimeType
                            }
                        );

                    if (
                        audioBlob.size ===
                        0
                    ) {
                        mediaRecorder._stopResolve?.(
                            ""
                        );

                        mediaRecorder._stopResolve =
                            null;

                        return;
                    }

                    const transcript =
                        await transcribeRecording(
                            audioBlob
                        );

                    mediaRecorder._stopResolve?.(
                        transcript
                    );

                    mediaRecorder._stopResolve =
                        null;

                    if (
                        transcript &&
                        !mediaRecorder._sendAfterTranscription
                    ) {
                        setPrompt(prev => {
                            const existing =
                                prev.trim();

                            return existing
                                ? `${existing} ${transcript}`
                                : transcript;
                        });
                    }

                    mediaRecorder._sendAfterTranscription =
                        false;
                };

            mediaRecorder.start();

            setIsRecording(true);

            recordingTimerRef.current =
                setInterval(() => {
                    setRecordingTime(
                        previous => {
                            const next =
                                previous + 1;

                            if (
                                next >=
                                MAX_RECORDING_SECONDS
                            ) {
                                if (
                                    mediaRecorder.state ===
                                    "recording"
                                ) {
                                    mediaRecorder.stop();
                                }
                            }

                            return next;
                        }
                    );
                }, 1000);

            recordingTimeoutRef.current =
                setTimeout(() => {
                    if (
                        mediaRecorder.state ===
                        "recording"
                    ) {
                        mediaRecorder.stop();
                    }
                }, MAX_RECORDING_SECONDS * 1000);
        } catch (err) {
            console.error(
                "Microphone error:",
                err
            );

            if (
                err.name ===
                "NotAllowedError"
            ) {
                alert(
                    "Microphone permission was denied. Please allow microphone access and try again."
                );
            } else if (
                err.name ===
                "NotFoundError"
            ) {
                alert(
                    "No microphone was found."
                );
            }
        }
    };

    const handleProfileClick = () => {
        setIsOpen(prev => !prev);
    };

    const handleWorkspaceInfo = () => {
        setIsOpen(false);
        onOpenWorkspaceInfo();
    };

    const handleRAGConfiguration = () => {
        setIsOpen(false);
        onOpenRAGExperiments();
    };

    const handleLogout = async () => {
        try {
            await fetch(
                `${API_URL}/api/auth/logout`,
                {
                    credentials:
                        "include"
                }
            );

            setPrevChats([]);
            setReply(null);
            setPrompt("");
            setNewChat(true);
            setPage("login");
        } catch (err) {
            console.error(err);
        }
    };

    const hasWorkspace =
        Boolean(currentWorkspaceId);

    const hasThread =
        hasWorkspace && !newChat;

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>Aether</span>

                <div className="navbarActions">
                    {!newChat && (
                        <button
                            type="button"
                            className="threadEvaluationButton"
                            onClick={
                                onOpenThreadEvaluation
                            }
                            title="Evaluate this thread"
                        >
                            <i className="fa-solid fa-chart-line"></i>
                            Evaluation
                        </button>
                    )}

                    <div
                        className="userIconDiv"
                        onClick={
                            handleProfileClick
                        }
                    >
                        <span>
                            <i className="fa-solid fa-user"></i>
                        </span>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="dropdown">
                    {!hasWorkspace && (
                        <div
                            className="dropDownItem"
                            onClick={
                                handleLogout
                            }
                        >
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            Logout
                        </div>
                    )}

                    {hasWorkspace && (
                        <div
                            className="dropDownItem"
                            onClick={
                                handleWorkspaceInfo
                            }
                        >
                            <i className="fa-solid fa-folder-open"></i>
                            Workspace Info
                        </div>
                    )}

                    {hasThread && (
                        <div
                            className="dropDownItem"
                            onClick={
                                handleRAGConfiguration
                            }
                        >
                            <i className="fa-solid fa-sliders"></i>
                            RAG Configuration
                        </div>
                    )}

                    {hasWorkspace && (
                        <div
                            className="dropDownItem"
                            onClick={
                                handleLogout
                            }
                        >
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            Logout
                        </div>
                    )}
                </div>
            )}

            <Chat />

            <div className="loading">
                <ScaleLoader
                    loading={loading}
                />
            </div>

            {currentWorkspaceId &&
                selectedFiles.map(
                    (file, index) => (
                        <div
                            className="selectedFile"
                            key={index}
                        >
                            <i className="fa-solid fa-file"></i>

                            <span>
                                {file.name}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedFiles(
                                        prev =>
                                            prev.filter(
                                                (_, i) =>
                                                    i !==
                                                    index
                                            )
                                    )
                                }
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    )
                )}

            {currentWorkspaceId && (
                <div className="chatInput">
                    <div className="userInput">
                        <UploadButton
                            onFileSelected={
                                file =>
                                    setSelectedFiles(
                                        prev => [
                                            ...prev,
                                            file
                                        ]
                                    )
                            }
                        />

                        <button
                            type="button"
                            className={`webSearchButton ${
                                webSearchEnabled
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setWebSearchEnabled(
                                    prev =>
                                        !prev
                                )
                            }
                            disabled={
                                loading ||
                                isTranscribing
                            }
                            title={
                                webSearchEnabled
                                    ? "Web search enabled"
                                    : "Enable web search"
                            }
                        >
                            <i className="fa-solid fa-globe"></i>
                        </button>

                        <button
                            type="button"
                            className={`voiceButton ${
                                isRecording
                                    ? "recording"
                                    : ""
                            } ${
                                isTranscribing
                                    ? "transcribing"
                                    : ""
                            }`}
                            onClick={
                                handleVoiceInput
                            }
                            disabled={
                                isTranscribing
                            }
                            title={
                                isTranscribing
                                    ? "Transcribing..."
                                    : isRecording
                                        ? "Stop recording"
                                        : "Voice input"
                            }
                        >
                            <i
                                className={
                                    isTranscribing
                                        ? "fa-solid fa-spinner fa-spin"
                                        : isRecording
                                            ? "fa-solid fa-stop"
                                            : "fa-solid fa-microphone"
                                }
                            ></i>
                        </button>

                        {isRecording && (
                            <span className="recordingTimer">
                                {String(
                                    Math.floor(
                                        recordingTime /
                                            60
                                    )
                                ).padStart(
                                    2,
                                    "0"
                                )}
                                :
                                {String(
                                    recordingTime %
                                        60
                                ).padStart(
                                    2,
                                    "0"
                                )}
                            </span>
                        )}

                        <input
                            placeholder={
                                isTranscribing
                                    ? "Transcribing..."
                                    : webSearchEnabled
                                        ? "Search the web..."
                                        : "Ask anything"
                            }
                            value={prompt}
                            onChange={e =>
                                setPrompt(
                                    e.target.value
                                )
                            }
                            onKeyDown={e => {
                                if (
                                    e.key ===
                                        "Enter" &&
                                    !isTranscribing
                                ) {
                                    getReply();
                                }
                            }}
                        />

                        <div
                            id="submit"
                            onClick={() => {
                                if (
                                    isRecording
                                ) {
                                    getReply();
                                } else if (
                                    !isTranscribing
                                ) {
                                    getReply();
                                }
                            }}
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                    </div>

                    <p className="info">
                        Aether's knowledge base contains
                        information through October 2023.{" "}
                        <button
                            type="button"
                            className="infoLink"
                            onClick={() =>
                                setShowKnowledgeInfo(
                                    true
                                )
                            }
                        >
                            Learn more
                        </button>
                    </p>
                </div>
            )}

            {showKnowledgeInfo && (
                <div
                    className="knowledgeModalOverlay"
                    onClick={() =>
                        setShowKnowledgeInfo(
                            false
                        )
                    }
                >
                    <div
                        className="knowledgeModal"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >
                        <div className="knowledgeModalHeader">
                            <h3>
                                Aether's Knowledge
                            </h3>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowKnowledgeInfo(
                                        false
                                    )
                                }
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <p>
                            Aether's built-in
                            knowledge is current
                            through
                            <strong>
                                {" "}October 2023
                            </strong>.
                        </p>

                        <p>
                            For newer information,
                            turn on Web Search
                            using the globe
                            button beside the
                            message box.
                        </p>

                        <button
                            type="button"
                            className="knowledgeModalDone"
                            onClick={() =>
                                setShowKnowledgeInfo(
                                    false
                                )
                            }
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}