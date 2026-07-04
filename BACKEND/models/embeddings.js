import mongoose from "mongoose";

const EmbeddingSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        index: true
    },

    messageNumber: {
        type: Number,
        required: true
    },

    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },

    content: {
        type: String,
        required: true
    },

    embedding: {
        type: [Number],
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Embedding", EmbeddingSchema);