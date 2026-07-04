import './App.css'
import Chat from './Chat.jsx'
import Sidebar from './Sidebar.jsx'
import Chatwindow from './Chatwindow.jsx'
import { MyContext } from './MyContext'
import { useState,useEffect } from 'react'
import {v1 as uuidv1} from 'uuid'
import Login from "./components/Login";
import Register from "./components/Register"; 

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadID, setCurrThreadID] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [page, setPage] = useState("login");
  const [loading, setLoading] = useState(true);

  const getAllThreads = async () => {
      try {
          const response = await fetch("http://localhost:8080/api/thread",
            {
              credentials : 'include'
            }
          );
          const res = await response.json();

          const filteredData = res.map(thread => ({
              threadId: thread.threadId,
              title: thread.title
          }));

          setAllThreads(filteredData);

      } catch (err) {
          console.log(err);
      }
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
    setPage
    };

    useEffect(() => {

        async function checkLogin() {

            try {

                const response = await fetch(
                    "http://localhost:8080/api/auth/me",
                    {
                        credentials: "include"
                    }
                );

                if (response.ok) {

                    setPage("chat");

                } else {

                    setPage("login");

                }

            } catch (err) {

                console.error(err);

                setPage("login");

            }

            setLoading(false);

        }

        checkLogin();

    }, []);

    if (loading) {
        return <h1>Loading...</h1>;
    }
  return (
      <>
        <div className='app'>
          <MyContext.Provider value={providerValues}>

              {page === "login" && (
                  <Login />
              )}

              {page === "register" && (
                  <Register />
              )}

              {page === "chat" && (
                  <>
                      <Sidebar />
                      <Chatwindow />
                  </>
              )}

          </MyContext.Provider>
        </div>
    </>
  )
}

export default App
