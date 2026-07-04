import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { openAIResponse } from "./utils/openai.js";

import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import { getEmbedding } from "./utils/embeddings.js";
import authRoutes from "./routes/auth.js";
import session from "express-session";
import passport from "./config/passport.js";

const app = express();
const PORT = 8080;

dotenv.config();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);
app.use(passport.initialize());
app.use(passport.session());



const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
}

await connectDB();



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);


const embedding = await getEmbedding("Hello world");
console.log(embedding.length);