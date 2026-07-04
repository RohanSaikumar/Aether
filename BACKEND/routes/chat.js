import express from "express";
import Thread from "../models/threads.js";
import { openAIResponse } from "../utils/openai.js";
import Embedding from "../models/embeddings.js";
import { getEmbedding } from "../utils/embeddings.js";
import { retrieveMemories } from "../utils/retrieveMemories.js";
import { ensureAuthenticated } from "../middleware/auth.js";
const router = express.Router();

//test
router.post("/test", async (req, res) => {
    try {
        let thread = new Thread({
            threadId: "123",
            title: "Testing New Thread"
        });

        const response = await thread.save();
        res.send(response);
    } catch (err) {
    console.error(err);

    res.status(500).json({
        error: err.message
    });
}
});

router.get("/thread", ensureAuthenticated , async (req, res) => {
    try {
        let threads = await Thread.find({userId: req.user._id}).sort({updatedAt: -1});
        res.json(threads);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Failed to fetch threads"});  
}
});
router.get("/thread/:threadId", ensureAuthenticated , async (req, res) => {
    try {
        let thread = await Thread.findOne({ threadId: req.params.threadId, userId: req.user._id });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(thread.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch thread" });
    }
});

router.delete("/thread/:threadId", ensureAuthenticated , async (req, res) => {
    try {

        const threadId = req.params.threadId;

        const result = await Thread.deleteOne({ threadId , userId: req.user._id });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        await Embedding.deleteMany({ threadId });

        res.status(200).json({
            message: "Thread and embeddings deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete thread"
        });
    }
});

router.post("/chat", ensureAuthenticated , async (req, res) => {
    const { threadId, message } = req.body;

    if (!threadId || !message) {
        return res.status(400).json({ error: "missing required fields" });
    }

    try {
        console.log("threadId:", threadId);

        let thread = await Thread.findOne({
            threadId,
            userId: req.user._id
        });

        console.log("Found thread:", thread);

        if (!thread) {
            thread = new Thread({
                threadId,
                userId: req.user._id,
                title: message,
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            });
        }else {
            thread.messages.push({
                role: "user",
                content: message
            });
        }

        // Retrieval
        const memoryContext = await retrieveMemories(thread, message);


        // Save user embedding
        const userEmbedding = await getEmbedding(message);

        await Embedding.create({
            threadId,
            messageNumber: thread.messages.length - 1,
            role: "user",
            content: message,
            embedding: userEmbedding
        });

        // Build GPT context
        const recentContext = thread.messages.slice(-5);

        const context = [...memoryContext, ...recentContext];

        const seen = new Set();

        const finalContext = context.filter(msg => {
            const key = `${msg.role}:${msg.content}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        });

        const aiResponse = await openAIResponse(finalContext);

        thread.messages.push({
            role: "assistant",
            content: aiResponse
        });

        // Save assistant embedding
        const assistantEmbedding = await getEmbedding(aiResponse);

        await Embedding.create({
            threadId,
            messageNumber: thread.messages.length - 1,
            role: "assistant",
            content: aiResponse,
            embedding: assistantEmbedding
        });

        thread.updatedAt = new Date();

        const data = await thread.save();

        console.log(data);

        res.json({ response: aiResponse });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process chat" });
    }
});


export default router;