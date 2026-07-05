import './Sidebar.css';
import { useContext,useEffect } from 'react';
import { MyContext } from './MyContext.jsx';
import {v1 as uuidv1} from 'uuid';
import blacklogo from "./assets/blacklogo.png";

export default function Sidebar() {
    const { getAllThreads, allThreads, setAllThreads,currThreadID, setCurrThreadID,newChat, setNewChat, prompt,setPrompt,reply,setReply, setPrevChats } = useContext(MyContext);
    

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadID(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async (newThreadID) => {
        setCurrThreadID(newThreadID);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${newThreadID}`,

                {
                credentials: "include"
            }
            );
            const res = await response.json();

            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log(err);
        }
    };
    
    const deleteThread = async (threadID) => {

        try {
            const response = awaitfetch(`${import.meta.env.VITE_API_URL}/api/thread/${threadID}`
, 
            {
                method: 'DELETE',
                credentials: "include"
            });
            const res = await response.json();
            console.log(res);
            setAllThreads(
                prevThreads => prevThreads.filter(thread => thread.threadId !== threadID));
                if (currThreadID === threadID) {
                    createNewChat();
                };
        } catch(err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadID]);

    
    return (
        <>
            <section className="sidebar">
                <button onClick = {createNewChat} >
                <img src={blacklogo} alt="gpt logo"></img>
                <span><i className="fa-solid fa-pen-to-square"></i></span>
                </button>

                <ul className="history">
                    
                    {
                        allThreads?.map((thread, idx) => (
                            <li key={idx} onClick = {() => changeThread(thread.threadId)}
                                className={currThreadID === thread.threadId ? "highlighted" : ""}
                            >
                                {thread.title}
                                <i className="fa-solid fa-trash"
                                   onClick={(e) => {
                                    e.stopPropagation(); //stops event from bubbling up to the parent li element
                                    deleteThread(thread.threadId);
                                }}>
                                </i>
                            </li>
                        ))
                    }

                </ul>

                

                <div className="sign">
                <p>By Rohan Saikumar</p>
                </div>
            </section>
        </>
        );


};