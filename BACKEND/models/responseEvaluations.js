import mongoose from "mongoose";

const ResponseEvaluationSchema = new mongoose.Schema({

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

    metricId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ResponseMetric",
        required: true,
        index: true
    },

    quality: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },

    faithfulness: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },

    relevance: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },

    retrieval: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },

    reasoning: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model(
    "ResponseEvaluation",
    ResponseEvaluationSchema
);