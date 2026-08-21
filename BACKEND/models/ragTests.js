import mongoose from "mongoose";

const RAGTestSchema = new mongoose.Schema({

    // =========================
    // SCOPE
    // =========================

    workspaceId: {
        type: String,
        required: true,
        index: true
    },

    threadId: {
        type: String,
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // =========================
    // TEST DEFINITION
    // =========================

    testId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    question: {
        type: String,
        required: true,
        trim: true
    },

    expectedAnswer: {
        type: String,
        required: true,
        trim: true
    },

    // =========================
    // LATEST TEST RESULT
    // =========================

    actualAnswer: {
        type: String,
        default: null
    },

    quality: {
        type: Number,
        default: null
    },

    retrievalScore: {
        type: Number,
        default: null
    },

    faithfulnessScore: {
        type: Number,
        default: null
    },

    relevanceScore: {
        type: Number,
        default: null
    },

    overallScore: {
        type: Number,
        default: null
    },

    passed: {
        type: Boolean,
        default: null
    },

    reasoning: {
        type: String,
        default: null
    },

    // =========================
    // PERFORMANCE / USAGE
    // =========================

    latencyMs: {
        type: Number,
        default: null
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

    // =========================
    // RETRIEVAL COUNTS
    // =========================

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

    // =========================
    // EXECUTION
    // =========================

    lastRunAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model(
    "RAGTest",
    RAGTestSchema
);