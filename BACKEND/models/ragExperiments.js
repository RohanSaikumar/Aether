import mongoose from "mongoose";

const RAGExperimentSchema = new mongoose.Schema({
    experimentId: {
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

    name: {
        type: String,
        required: true
    },

    config: {
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

    status: {
        type: String,
        enum: [
            "created",
            "running",
            "completed",
            "failed"
        ],
        default: "created"
    },
    isApplied: {
        type: Boolean,
        default: false
    },

    results: {
        summary: {
            totalTests: {
                type: Number,
                default: 0
            },

            testsPassed: {
                type: Number,
                default: 0
            },

            testsFailed: {
                type: Number,
                default: 0
            },

            passRate: {
                type: Number,
                default: 0
            },

            quality: {
                type: Number,
                default: null
            },

            faithfulness: {
                type: Number,
                default: null
            },

            relevance: {
                type: Number,
                default: null
            },

            retrieval: {
                type: Number,
                default: null
            },

            overallScore: {
                type: Number,
                default: null
            },

            latencyMs: {
                type: Number,
                default: null
            },

            totalInputTokens: {
                type: Number,
                default: 0
            },

            totalOutputTokens: {
                type: Number,
                default: 0
            },

            totalTokens: {
                type: Number,
                default: 0
            },

            totalCostUsd: {
                type: Number,
                default: 0
            }
        },

        tests: [
            {
                testId: {
                    type: String
                },

                question: {
                    type: String
                },

                expectedAnswer: {
                    type: String
                },

                actualAnswer: {
                    type: String,
                    default: null
                },

                quality: {
                    type: Number,
                    default: null
                },

                faithfulness: {
                    type: Number,
                    default: null
                },

                relevance: {
                    type: Number,
                    default: null
                },

                retrieval: {
                    type: Number,
                    default: null
                },

                overallScore: {
                    type: Number,
                    default: null
                },

                passed: {
                    type: Boolean,
                    default: false
                },

                reasoning: {
                    type: String,
                    default: null
                },

                latencyMs: {
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

                usage: {
                    type: mongoose.Schema.Types.Mixed,
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

                error: {
                    type: String,
                    default: null
                }
            }
        ],

        durationMs: {
            type: Number,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
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
    "RAGExperiment",
    RAGExperimentSchema
);