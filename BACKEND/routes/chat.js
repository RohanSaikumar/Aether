import express from "express";
import Thread from "../models/threads.js";
import { openAIResponse } from "../utils/openai.js";
import { getEmbedding } from "../utils/embeddings.js";
import { retrieveChats } from "../utils/retrieveChats.js";
import { ensureAuthenticated } from "../middleware/auth.js";
import { rewriteQuery } from "../utils/rewriteQuery.js";
import { extractMemory } from "../utils/extractMemories.js";
import { retrieveMemories } from "../utils/retrieveMemories.js";
import { retrieveDocuments } from "../utils/retrieveDocuments.js";
import Document from "../models/documents.js";
import Embedding from "../models/embeddings.js";
import Memory from "../models/memories.js";
import Workspace from "../models/workspaces.js";
import ResponseMetric from "../models/responseMetrics.js";
import ResponseEvaluation from "../models/responseEvaluations.js";
import { evaluateResponse } from "../utils/evaluateResponse.js";
import DocumentFile from "../models/documentFiles.js";
import RAGTest from "../models/ragTests.js";
import RAGExperiment from "../models/ragExperiments.js";

const router = express.Router();

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

router.get("/thread", ensureAuthenticated, async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({
                error: "workspaceId is required."
            });
        }

        const threads = await Thread.find({
            userId: req.user._id,
            workspaceId
        }).sort({
            updatedAt: -1
        });

        res.json(threads);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to fetch threads"
        });
    }
});

router.get("/thread/:threadId", ensureAuthenticated, async (req, res) => {
    try {
        let thread = await Thread.findOne({
            threadId: req.params.threadId,
            userId: req.user._id
        });

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        res.json(thread.messages);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to fetch thread"
        });
    }
});

router.delete(
    "/thread/:threadId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { threadId } = req.params;

            const thread = await Thread.findOne({
                threadId,
                userId: req.user._id
            });

            if (!thread) {
                return res.status(404).json({
                    error: "Thread not found"
                });
            }

            const workspaceId = thread.workspaceId;

            const documents = await Document.find({
                threadId,
                workspaceId
            }).select("documentId");

            const documentIds = documents.map(
                doc => doc.documentId
            );

            await Embedding.deleteMany({
                threadId
            });

            await Memory.deleteMany({
                threadId
            });

            await ResponseEvaluation.deleteMany({
                threadId,
                workspaceId
            });

            await ResponseMetric.deleteMany({
                threadId,
                workspaceId
            });

            await RAGTest.deleteMany({
                threadId,
                workspaceId,
                userId: req.user._id
            });

            await RAGExperiment.deleteMany({
                threadId,
                workspaceId,
                userId: req.user._id
            });

            if (documentIds.length > 0) {
                await DocumentFile.deleteMany({
                    documentId: {
                        $in: documentIds
                    },
                    workspaceId
                });
            }

            await Document.deleteMany({
                threadId,
                workspaceId
            });

            await Thread.deleteOne({
                threadId,
                userId: req.user._id
            });

            res.status(200).json({
                message: "Thread and all associated data deleted successfully."
            });
        } catch (err) {
            console.error("Delete thread error:", err);

            res.status(500).json({
                error: "Failed to delete thread."
            });
        }
    }
);

router.post("/chat", ensureAuthenticated, async (req, res) => {
    const {
        threadId,
        workspaceId,
        message,
        uploadedDocuments = [],
        webSearchEnabled = false
    } = req.body;

    const userContent =
        message?.trim() ||
        `[Uploaded ${uploadedDocuments.length} document(s)]`;

    if (
        !threadId ||
        !workspaceId ||
        (!message && uploadedDocuments.length === 0)
    ) {
        return res.status(400).json({
            error: "Either a message or a document is required."
        });
    }

    try {
        const workspace = await Workspace.findOne({
            workspaceId,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(404).json({
                error: "Workspace not found."
            });
        }

        let thread = await Thread.findOne({
            threadId,
            userId: req.user._id
        });

        if (!thread) {
            const threadTitle =
                message?.trim() ||
                (uploadedDocuments.length === 1
                    ? `📄 ${uploadedDocuments[0].filename}`
                    : `📄 ${uploadedDocuments.length} documents`);

            thread = new Thread({
                threadId,
                workspaceId,
                userId: req.user._id,
                title: threadTitle,
                ragConfig: {
                    documentTopK: 5,
                    documentThreshold: 0.5,
                    memoryTopK: 5,
                    memoryThreshold: 0.70,
                    chatTopK: 5,
                    chatThreshold: 0.60,
                    queryRewriting: true
                },
                messages: [{
                    role: "user",
                    content: userContent
                }]
            });
        } else {
            thread.messages.push({
                role: "user",
                content: userContent
            });
        }

        const ragConfig = thread.ragConfig || {
            documentTopK: 5,
            documentThreshold: 0.5,
            memoryTopK: 5,
            memoryThreshold: 0.70,
            chatTopK: 5,
            chatThreshold: 0.60,
            queryRewriting: true
        };

        

        const extracted = await extractMemory(
            userContent,
            thread.messages
                .slice(-5)
                .map(m => `${m.role}: ${m.content}`)
                .join("\n")
        );

        if (extracted.shouldRemember) {
            for (const mem of extracted.memories) {
                const embedding = await getEmbedding(mem.memory);

                const existingMemory = await Memory.findOne({
                    threadId,
                    category: mem.category
                });

                if (!existingMemory) {
                    await Memory.create({
                        threadId,
                        category: mem.category,
                        memory: mem.memory,
                        tags: mem.tags,
                        embedding
                    });

                } else {
                    existingMemory.memory = mem.memory;
                    existingMemory.tags = mem.tags;
                    existingMemory.embedding = embedding;
                    await existingMemory.save();

                }
            }
        }

        const rewrittenQuery = ragConfig.queryRewriting
            ? await rewriteQuery(
                thread.messages,
                userContent
            )
            : userContent;

        console.log("Rewritten:", rewrittenQuery);

        const queryEmbedding =
            await getEmbedding(rewrittenQuery);

        const [
            chatContext,
            memoryContext,
            documentContext
        ] = await Promise.all([
            retrieveChats(
                thread,
                queryEmbedding,
                {
                    topK: ragConfig.chatTopK,
                    similarityThreshold:
                        ragConfig.chatThreshold
                }
            ),
            retrieveMemories(
                thread,
                queryEmbedding,
                {
                    topK: ragConfig.memoryTopK,
                    similarityThreshold:
                        ragConfig.memoryThreshold
                }
            ),
            retrieveDocuments(
                thread,
                queryEmbedding,
                {
                    topK: ragConfig.documentTopK,
                    similarityThreshold:
                        ragConfig.documentThreshold
                }
            )
        ]);

        let webContext = [];

        if (webSearchEnabled) {
            const tavilyResponse = await fetch(
                "https://api.tavily.com/search",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        api_key:
                            process.env.TAVILY_API_KEY,
                        query: rewrittenQuery,
                        search_depth: "basic",
                        max_results: 5,
                        include_answer: false
                    })
                }
            );

            if (!tavilyResponse.ok) {
                throw new Error(
                    `Tavily search failed: ${tavilyResponse.status}`
                );
            }

            const tavilyData =
                await tavilyResponse.json();

            webContext =
                tavilyData.results || [];

            console.log(
                "Web Search Results:",
                webContext
            );
        }

        const embeddingText = userContent;
        const userEmbeddingPromise =
            getEmbedding(embeddingText);

        const recentContext =
            thread.messages.slice(-5);

        const seen = new Set();

        const retrievedContext = [
            ...memoryContext,
            ...chatContext
        ];

        const uniqueContext =
            retrievedContext.filter(msg => {
                const key =
                    `${msg.role}:${msg.content}`;

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            });

        const memoryText =
            uniqueContext.length > 0
                ? uniqueContext
                    .map(
                        msg =>
                            `${msg.role}: ${msg.content}`
                    )
                    .join("\n")
                : "No relevant memories found.";

        let documentText =
            documentContext.length > 0
                ? documentContext
                    .map(doc => doc.content)
                    .join(
                        "\n\n-------------------------\n\n"
                    )
                : "";

        if (uploadedDocuments.length > 0) {
            const uploadedText =
                uploadedDocuments
                    .map(
                        doc =>
                            `The user uploaded the following document.

Filename:
${doc.filename}

Content:

${doc.chunks.join(
    "\n\n-------------------------\n\n"
)}`
                    )
                    .join(
                        "\n\n=========================\n\n"
                    );

            documentText = `${uploadedText}

${documentText}`;
        }

        if (!documentText.trim()) {
            documentText =
                "No relevant documents found.";
        }

        const webText =
            webContext.length > 0
                ? webContext
                    .map(
                        result =>
                            `Title: ${result.title}
Source: ${result.url}
Content:
${result.content}`
                    )
                    .join(
                        "\n\n-------------------------\n\n"
                    )
                : "No web search results.";

        const finalContext = [
            {
                role: "system",
                content: `You are Aether, a conversational AI assistant.

You have access to four sources of information:

1. Relevant memories and past conversations.
2. Relevant uploaded document excerpts.
3. The recent conversation.
4. Web search results when web search is enabled.

Use the retrieved context ONLY if it helps answer the user's question.
Never mention that you were given memories or document chunks unless the user explicitly asks.

When web search results are provided, use them for current or web-based information when relevant.
Do not claim information from web search results that is not supported by those results.

Relevant Memories & Chats

${memoryText}

Relevant Documents

${documentText}

Relevant Web Search Results

${webText}
`
            },
            ...recentContext
        ];

        res.setHeader(
            "Content-Type",
            "text/event-stream"
        );
        res.setHeader(
            "Cache-Control",
            "no-cache"
        );
        res.setHeader(
            "Connection",
            "keep-alive"
        );
        res.flushHeaders();

        const sendChunk = chunk => {
            res.write(
                `data: ${JSON.stringify({
                    chunk
                })}\n\n`
            );
        };

        const responseStartTime =
            Date.now();

        const aiResult =
            await openAIResponse(
                finalContext,
                sendChunk
            );

        const latencyMs =
            Date.now() -
            responseStartTime;

        const aiResponse =
            aiResult.text;

        const usage =
            aiResult.usage;

        const inputTokens =
            usage?.inputTokens ?? null;

        const outputTokens =
            usage?.outputTokens ?? null;

        const estimatedCostUsd =
            inputTokens !== null &&
            outputTokens !== null
                ? (inputTokens / 1_000_000) * 2.00 +
                  (outputTokens / 1_000_000) * 8.00
                : null;

        const responseMetric =
            await ResponseMetric.create({
                threadId,
                workspaceId,
                model: "gpt-4.1",
                latencyMs,
                inputTokens,
                outputTokens,
                totalTokens:
                    usage?.totalTokens ?? null,
                estimatedCostUsd,
                retrievedDocuments:
                    documentContext.length,
                retrievedMemories:
                    memoryContext.length,
                retrievedChats:
                    chatContext.length
            });

        const userEmbedding =
            await userEmbeddingPromise;

        await Embedding.create({
            threadId,
            messageNumber:
                thread.messages.length - 1,
            role: "user",
            content: embeddingText,
            embedding: userEmbedding
        });

        thread.messages[
            thread.messages.length - 1
        ].attachments =
            uploadedDocuments.map(doc => ({
                filename: doc.filename,
                documentId: doc.documentId,
                mimeType: doc.mimeType
            }));

        thread.messages.push({
            role: "assistant",
            content: aiResponse
        });

        const assistantEmbedding =
            await getEmbedding(aiResponse);

        await Embedding.create({
            threadId,
            messageNumber:
                thread.messages.length - 1,
            role: "assistant",
            content: aiResponse,
            embedding: assistantEmbedding
        });

        thread.updatedAt =
            new Date();

        await thread.save();

        res.write(
            `data: ${JSON.stringify({
                done: true
            })}\n\n`
        );

        res.end();

        evaluateResponse({
            question: userContent,
            answer: aiResponse,
            documentContext,
            memoryContext,
            chatContext
        })
            .then(async evaluation => {
                await ResponseEvaluation.create({
                    threadId,
                    workspaceId,
                    metricId:
                        responseMetric._id,
                    quality:
                        evaluation.quality,
                    faithfulness:
                        evaluation.faithfulness,
                    relevance:
                        evaluation.relevance,
                    retrieval:
                        evaluation.retrieval,
                    reasoning:
                        evaluation.reasoning
                });

            })
            .catch(err => {
                console.error(
                    "Background response evaluation failed:",
                    err
                );
            });
    } catch (err) {
        console.error(err);

        if (!res.headersSent) {
            res.status(500).json({
                error:
                    "Failed to process chat"
            });
        } else {
            res.write(
                `data: ${JSON.stringify({
                    error:
                        "Failed to process chat"
                })}\n\n`
            );

            res.end();
        }
    }
});

export default router;