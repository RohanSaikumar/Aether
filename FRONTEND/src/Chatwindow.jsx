import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { ScaleLoader } from "react-spinners";
import { useState,useEffect,useContext } from "react";

export default function ChatWindow(){

    const { getAllThreads, setNewChat, prompt, setPrompt, reply, setReply, currThreadID, setCurrThreadID,prevChats,setPrevChats,setPage } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getReply = async () => {
            setLoading(true);
            setNewChat(false);
            const options = {
                method: "POST",

                credentials: "include",

                headers: {
                "Content-Type": "application/json",
            },
                body: JSON.stringify({
                    message: prompt,
                    threadId: currThreadID,
                }),
                };

            try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, options);
            const res = await response.json();
            console.log(response);
            console.log(res);
            setReply(res.response);
            await getAllThreads();
            } catch (err) {
            console.log(err);
            }
            setLoading(false);
    }

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }
    const handleLogout = async () => {

        try {

            await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/logout`,
                {
                    credentials: "include"
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
useEffect(() => {
    if (prompt && reply) {
        setPrevChats(prevChats => (
            [...prevChats,
                {
                    role: "user",
                    content: prompt
                },
                {
                    role: "assistant",
                    content: reply
            }]
        ))
    }

    setPrompt("")
}, [reply]);
    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>Aether</span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span><i className="fa-solid fa-user"></i></span>
                </div>
                
            </div>
            
            {
                isOpen && 
                <div className="dropdown">
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket"></i> Logout</div>
                </div>
            }
            <Chat></Chat>
            <div className="loading">
            <ScaleLoader loading={loading}></ScaleLoader>
            </div>
            <div className="chatInput">
                <div className="userInput">
                    <input placeholder="Ask anything" value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            getReply();
                        }
                     }}></input>

                    <div id="submit" onClick = {getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>

                <p className="info">
                    Aether can make mistakes. Check important info. See Cookie
                    Preferences.
                </p>
            </div>
        </div>       
        );
};