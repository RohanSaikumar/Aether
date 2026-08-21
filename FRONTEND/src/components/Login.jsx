import { useContext, useState } from "react";
import { MyContext } from "../MyContext";
import "./Login.css";
import { API_URL } from "../config.js";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { setPage } = useContext(MyContext);

    const handleLogin = async e => {
        e?.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError("Please enter your username and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setPage("chat");
            } else {
                setError(
                    data.error ||
                    "Invalid username or password."
                );
            }
        } catch (err) {
            console.error(err);
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="authContainer">
            <form
                className="authCard"
                onSubmit={handleLogin}
            >
                <div className="authBrand">
                    <div className="authLogo">
                        A
                    </div>

                    <h1>Aether</h1>

                    <p>
                        Your intelligent workspace
                    </p>
                </div>

                <div className="authHeading">
                    <h2>Welcome Back!</h2>

                    <p>
                        Sign in to continue to Aether
                    </p>
                </div>

                <div className="authFields">
                    <label>
                        Username
                    </label>

                    <input
                        className="authInput"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e =>
                            setUsername(e.target.value)
                        }
                        autoComplete="username"
                    />

                    <label>
                        Password
                    </label>

                    <input
                        className="authInput"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e =>
                            setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                    />
                </div>

                {error && (
                    <div className="authError">
                        {error}
                    </div>
                )}

                <button
                    className="authButton"
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Signing in..."
                        : "Sign in"}
                </button>

                <div className="authDivider">
                    <span>New to Aether?</span>
                </div>

                <button
                    className="switchButton"
                    type="button"
                    onClick={() =>
                        setPage("register")
                    }
                >
                    Create an account
                </button>
            </form>
        </div>
    );
}

export default Login;