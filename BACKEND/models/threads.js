import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({

    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },

    content: {
        type: String,
        required: true
    },

    attachments: [
        {
            filename: String,
            documentId: String,
            mimeType: String
        }
    ],

    timestamp: {
        type: Date,
        default: Date.now
    }

});

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true
    },

    workspaceId: {
        type: String,
        required: true,
        index: true
    },

    messages: [MessageSchema],

    title: {
        type: String,
        default: "New Thread"
    },

    ragConfig: {
        documentTopK: {
            type: Number,
            default: 5
        },

        documentThreshold: {
            type: Number,
            default: 0.5
        },

        memoryTopK: {
            type: Number,
            default: 5
        },

        memoryThreshold: {
            type: Number,
            default: 0.70
        },

        chatTopK: {
            type: Number,
            default: 5
        },

        chatThreshold: {
            type: Number,
            default: 0.60
        },

        queryRewriting: {
            type: Boolean,
            default: true
        }
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

export default mongoose.model("Thread", ThreadSchema);