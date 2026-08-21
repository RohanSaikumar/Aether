import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({

    threadId: {
        type: String,
        required: true,
        index: true
    },

    documentId: {
        type: String,
        required: true,
        index: true
    },

    workspaceId: {
        type: String,
        required: true,
        index: true
    },

    fileHash: {
        type: String,
        required: true,
        index: true
    },

    filename: {
        type: String,
        required: true
    },

    chunkNumber: {
        type: Number,
        required: true
    },

    text: {
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

export default mongoose.model("Document", DocumentSchema);