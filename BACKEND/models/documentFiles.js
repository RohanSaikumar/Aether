import mongoose from "mongoose";

const DocumentFileSchema = new mongoose.Schema({

    documentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    workspaceId: {
        type: String,
        required: true,
        index: true
    },

    filename: {
        type: String,
        required: true
    },

    fileHash: {
        type: String,
        required: true
    },

    mimeType: {
        type: String,
        required: true
    },

    fileData: {
        type: Buffer,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model("DocumentFile", DocumentFileSchema);