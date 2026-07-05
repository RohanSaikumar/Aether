import { useContext, useState } from "react";
import { MyContext } from "../MyContext";
import "./Login.css"

function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const { setPage } = useContext(MyContext);

    const handleLogin = async () => {

        try {

            const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/auth/login`, 
                    
                    {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert("Login Successful!");

                setPage("chat");

            } else {

                alert(data.error);

            }

        } catch (err) {

            console.error(err);

        }

    };

    return (

            <div className="authContainer">

                <div className="authCard">

                    <h1 className="logo">Aether</h1>
                    <h1>Login</h1>

                    <input
                        className="authInput"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <br /><br />

                    <input
                        className="authInput"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <br /><br />

                    <button className="authButton" onClick={handleLogin}>
                        Login
                    </button>

                    <br /><br />

                    <button className="switchButton" onClick={() => setPage("register")}>
                        Create an Account
                    </button>

                </div>
            </div>
    );
}

export default Login;