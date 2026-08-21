import "./Chat.css";
import { useContext, useEffect, useRef } from "react";
import { MyContext } from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function Chat() {

    const {
        prevChats,
        newChat,
        reply,
        currentWorkspaceId
    } = useContext(MyContext);

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "auto"
        });
    }, [prevChats, reply, currentWorkspaceId]);

    return (
        <>

            {!currentWorkspaceId ? (

                <div className="introPage">

                    <div className="introLogo">
                        A
                    </div>

                    <h1>
                        Welcome to Aether
                    </h1>

                    <p className="introSubtitle">
                        Your intelligent workspace for
                        conversations, documents and
                        long-term context.
                    </p>

                    <div className="introFeatures">

                        <div className="introFeature">
                            <div className="featureIcon">
                                <i className="fa-solid fa-comments"></i>
                            </div>

                            <div>
                                <h3>
                                    AI-Powered Conversations
                                </h3>

                                <p>
                                    Get context-aware answers using
                                    Aether's intelligent retrieval
                                    and reasoning capabilities.
                                </p>
                            </div>
                        </div>

                        <div className="introFeature">
                            <div className="featureIcon">
                                <i className="fa-solid fa-file-lines"></i>
                            </div>

                            <div>
                                <h3>
                                    Document Intelligence
                                </h3>

                                <p>
                                    Upload your documents and ask
                                    questions using information
                                    directly from their contents.
                                </p>
                            </div>
                        </div>

                        <div className="introFeature">
                            <div className="featureIcon">
                                <i className="fa-solid fa-brain"></i>
                            </div>

                            <div>
                                <h3>
                                    Long-Term Memory
                                </h3>

                                <p>
                                    Preserve important context from
                                    previous conversations for more
                                    personalized responses over time.
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="introCTA">
                        <i className="fa-solid fa-plus"></i>

                        <span>
                            Create a workspace from the
                            sidebar to get started.
                        </span>
                    </div>

                </div>

            ) : newChat ? (

                <div className="newChat">
                    <h1>Start a New Chat</h1>

                    <p>
                        Ask Aether anything about your
                        workspace.
                    </p>
                </div>

            ) : null}


            {currentWorkspaceId && (

                <div className="chats">

                    {prevChats?.map((chat, idx) => {

                        return (

                            <div
                                key={idx}
                                className={
                                    chat.role === "user"
                                        ? "userDiv"
                                        : "gptDiv"
                                }
                            >

                                {chat.role === "user" ? (

                                    <div className="userMessage">

                                        {
                                            chat.attachments?.map(
                                                (attachment, index) => (

                                                    <div
                                                        className="chatAttachment"
                                                        key={index}
                                                    >

                                                        <i className="fa-solid fa-file-lines"></i>

                                                        <span>
                                                            {attachment.filename}
                                                        </span>

                                                    </div>

                                                )
                                            )
                                        }

                                        {!chat.content.startsWith("[Uploaded ") && (
                                            <p>
                                                {chat.content}
                                            </p>
                                        )}

                                    </div>

                                ) : (

                                    <ReactMarkdown
                                        rehypePlugins={[
                                            rehypeHighlight
                                        ]}
                                    >
                                        {chat.content}
                                    </ReactMarkdown>

                                )}

                            </div>

                        );

                    })}

                    {reply && (

                        <div className="gptDiv streamingReply">
                            {reply}
                        </div>

                    )}

                    <div ref={bottomRef} />

                </div>

            )}

        </>
    );
}