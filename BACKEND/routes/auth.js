import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import passport from "../config/passport.js";

const router = express.Router();


router.post("/register", async (req, res) => {
    try {
        const username = req.body.username?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Username, email and password are required."
            });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                error: "Username must be between 3 and 20 characters."
            });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({
                error:
                    "Username can only contain letters, numbers and underscores."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                error: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters."
            });
        }

        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                error:
                    "Password must contain at least one uppercase letter."
            });
        }

        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                error:
                    "Password must contain at least one lowercase letter."
            });
        }

        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                error:
                    "Password must contain at least one number."
            });
        }

        const existingUsername = await User.findOne({
            username
        });

        if (existingUsername) {
            return res.status(400).json({
                error: "Username is already taken."
            });
        }

        const existingEmail = await User.findOne({
            email
        });

        if (existingEmail) {
            return res.status(400).json({
                error: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully."
        });
    } catch (err) {
        console.error("Registration error:", err);

        res.status(500).json({
            error: "Registration failed. Please try again."
        });
    }
});

router.post("/login", (req, res, next) => {

    passport.authenticate("local", (err, user, info) => {

        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                error: info.message
            });
        }

        req.logIn(user, (err) => {

            if (err) {
                return next(err);
            }

            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });

        });

    })(req, res, next);

});


router.get("/me", (req, res) => {

    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Not logged in"
        });
    }

    res.json({
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
    });

});

router.get("/logout", (req, res, next) => {

    req.logout(function(err) {

        if (err) {
            return next(err);
        }

        req.session.destroy(() => {

            res.clearCookie("connect.sid");

            res.json({
                message: "Logged out successfully"
            });

        });

    });

});


export default router;