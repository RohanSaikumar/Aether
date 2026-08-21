import { useContext, useState } from "react";
import { MyContext } from "../MyContext";
import "./Register.css";
import { API_URL } from "../config.js";

function Register() {
    const { setPage } = useContext(MyContext);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanUsername) {
            return "Username is required.";
        }

        if (cleanUsername.length < 3 || cleanUsername.length > 20) {
            return "Username must be between 3 and 20 characters.";
        }

        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            return "Username can only contain letters, numbers and underscores.";
        }

        if (!cleanEmail) {
            return "Email is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return "Please enter a valid email address.";
        }

        if (!password) {
            return "Password is required.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        return "";
    };

    const handleRegister = async e => {
        e.preventDefault();

        if (loading) return;

        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        try {
            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: cleanUsername,
                        email: cleanEmail,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.error ||
                    "Unable to create your account."
                );
                return;
            }

            const loginResponse = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: cleanUsername,
                        password
                    })
                }
            );

            if (loginResponse.ok) {
                setPage("chat");
            } else {
                setPage("login");
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
                onSubmit={handleRegister}
            >
                <div className="authBrand">
                    <div className="authLogo">A</div>
                    <h1>Aether</h1>
                    <p>Your intelligent workspace</p>
                </div>

                <div className="authHeading">
                    <h2>Create your account</h2>
                    <p>Get started with Aether</p>
                </div>

                <div className="authFields">
                    <label>Username</label>
                    <input
                        className="authInput"
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoComplete="username"
                        maxLength={20}
                        disabled={loading}
                    />

                    <label>Email</label>
                    <input
                        className="authInput"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                    />

                    <label>Password</label>
                    <input
                        className="authInput"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        disabled={loading}
                    />

                    <div className="passwordRules">
                        <span>Password must contain:</span>
                        <span>• At least 8 characters</span>
                        <span>• One uppercase letter</span>
                        <span>• One lowercase letter</span>
                        <span>• One number</span>
                    </div>
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
                        ? "Creating account..."
                        : "Create account"}
                </button>

                <div className="authDivider">
                    <span>Already have an account?</span>
                </div>

                <button
                    className="switchButton"
                    type="button"
                    disabled={loading}
                    onClick={() => setPage("login")}
                >
                    Sign in instead
                </button>
            </form>
        </div>
    );
}

export default Register;