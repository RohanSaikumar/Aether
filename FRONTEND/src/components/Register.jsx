import { useState } from "react";
import { useContext } from "react";
import { MyContext } from "../MyContext";
import "./Register.css"


function Register() {
    const { setPage } = useContext(MyContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {

        try {

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                const loginResponse = await fetch(
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

                if (loginResponse.ok) {
                    setPage("chat");
                }
        }else {
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
                    <h1>Create Account</h1>

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
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

                    <button className="authButton" onClick= {handleRegister}>
                        Register
                    </button>

                    <br /><br />

                    <button className="authButton" onClick={() => setPage("login")}>
                        Already have an account?
                    </button>
                </div>
        </div>
    );
}

export default Register;