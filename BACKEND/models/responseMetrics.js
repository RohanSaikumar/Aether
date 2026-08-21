import mongoose from "mongoose";

const ResponseMetricSchema = new mongoose.Schema({

    threadId: {
        type: String,
        required: true,
        index: true
    },

    workspaceId: {
        type: String,
        required: true,
        index: true
    },

    model: {
        type: String,
        required: true
    },

    latencyMs: {
        type: Number,
        required: true
    },

    inputTokens: {
        type: Number,
        default: null
    },

    outputTokens: {
        type: Number,
        default: null
    },

    totalTokens: {
        type: Number,
        default: null
    },

    estimatedCostUsd: {
        type: Number,
        default: null
    },

    retrievedDocuments: {
        type: Number,
        default: 0
    },

    retrievedMemories: {
        type: Number,
        default: 0
    },

    retrievedChats: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model(
    "ResponseMetric",
    ResponseMetricSchema
);