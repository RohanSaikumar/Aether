import mongoose from "mongoose";

const MemorySchema = new mongoose.Schema({

    threadId: {
        type: String,
        required: true,
        index: true
    },

    memory: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true,
        index: true
    },

    tags: {
        type: [String],
        default: []
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

export default mongoose.model("Memory", MemorySchema);