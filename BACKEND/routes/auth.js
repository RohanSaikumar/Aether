import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import passport from "../config/passport.js";

const router = express.Router();


router.post("/register", async (req, res) => {

    const { username, email, password } = req.body;

    try {

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
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
            message: "User registered successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Registration failed"
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