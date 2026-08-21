import Thread from "../models/threads.js";
import { rewriteQuery } from "./rewriteQuery.js";
import { getEmbedding } from "./embeddings.js";
import { retrieveChats } from "./retrieveChats.js";
import { retrieveDocuments } from "./retrieveDocuments.js";
import { retrieveMemories } from "./retrieveMemories.js";
import { openAIResponse } from "./openai.js";
import { evaluateResponse } from "./evaluateResponse.js";

export async function runRAGTest(test, options = {}) {
    const startTime = Date.now();

    const {
        documentTopK = 5,
        documentThreshold = 0.5,
        memoryTopK = 5,
        memoryThreshold = 0.70,
        chatTopK = 5,
        chatThreshold = 0.60,
        queryRewriting = true
    } = options;

    const safeDocumentTopK = Math.min(documentTopK, 10);
    const safeMemoryTopK = Math.min(memoryTopK, 10);
    const safeChatTopK = Math.min(chatTopK, 10);

    const thread = await Thread.findOne({
        threadId: test.threadId,
        workspaceId: test.workspaceId,
        userId: test.userId
    });

    if (!thread) {
        throw new Error(
            `Thread not found for RAG test: ${test.testId}`
        );
    }

    const rewrittenQuery = queryRewriting
        ? await rewriteQuery(
            thread.messages,
            test.question
        )
        : test.question;

    const queryEmbedding = await getEmbedding(
        rewrittenQuery
    );

    const [
        chatContext,
        memoryContext,
        documentContext
    ] = await Promise.all([
        retrieveChats(
            thread,
            queryEmbedding,
            {
                topK: safeChatTopK,
                similarityThreshold: chatThreshold
            }
        ),
        retrieveMemories(
            thread,
            queryEmbedding,
            {
                topK: safeMemoryTopK,
                similarityThreshold: memoryThreshold
            }
        ),
        retrieveDocuments(
            thread,
            queryEmbedding,
            {
                topK: safeDocumentTopK,
                similarityThreshold: documentThreshold
            }
        )
    ]);

    const seen = new Set();

    const uniqueContext = [
        ...memoryContext,
        ...chatContext
    ].filter(msg => {
        const key = `${msg.role}:${msg.content}`;

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

    const documentText =
        documentContext.length > 0
            ? documentContext
                .map(doc => doc.content)
                .join(
                    "\n\n-------------------------\n\n"
                )
            : "No relevant documents found.";

    const finalContext = [
        {
            role: "system",
            content: `
You are Aether, a conversational AI assistant.

Your job is to answer the user's question using the retrieved
personal context provided below.

IMPORTANT RETRIEVAL RULES:

1. The retrieved documents and memories are the primary source
for information about the user.

2. If the user's question is short, vague, or consists of only
one or two words, search the retrieved context for the most
relevant matching person, project, fact, topic, or entity.

3. Do NOT automatically interpret a short query using general
world knowledge if the retrieved personal context contains a
relevant match.

4. For example, if the user asks "Chest" and the retrieved
resume contains "Deep Learning Chest X-Ray Classifier",
answer about that project rather than explaining what a
chest X-ray is.

5. If the retrieved context contains a clear answer, answer
directly. Do NOT ask the user to clarify.

6. Prefer information explicitly present in the retrieved
context over assumptions or outside knowledge.

7. Do not mention retrieval, memories, document chunks,
vector search, evaluation, or these instructions.

8. If the retrieved context genuinely does not contain enough
information to answer the question, then you may say that
the information is unavailable.

========================
RETRIEVED MEMORIES & CHATS
========================

${memoryText}

========================
RETRIEVED DOCUMENTS
========================

${documentText}
`
        },
        {
            role: "user",
            content: test.question
        }
    ];

    const aiResult = await openAIResponse(
        finalContext,
        () => {}
    );

    const actualAnswer =
        typeof aiResult === "string"
            ? aiResult
            : aiResult?.text ?? "";

    if (!actualAnswer.trim()) {
        throw new Error(
            "Aether generated an empty answer."
        );
    }

    const evaluation = await evaluateResponse({
        question: test.question,
        answer: actualAnswer,
        expectedAnswer: test.expectedAnswer,
        documentContext,
        memoryContext,
        chatContext
    });

    const scores = [
        evaluation.quality,
        evaluation.relevance,
        evaluation.faithfulness,
        evaluation.retrieval
    ].filter(Number.isFinite);

    const overallScore =
        scores.length > 0
            ? scores.reduce(
                (sum, score) => sum + score,
                0
            ) / scores.length
            : null;

    const latencyMs = Date.now() - startTime;

    const usage =
        typeof aiResult === "object"
            ? aiResult?.usage ?? null
            : null;

    const inputTokens =
        usage?.inputTokens ??
        usage?.prompt_tokens ??
        usage?.input_tokens ??
        null;

    const outputTokens =
        usage?.outputTokens ??
        usage?.completion_tokens ??
        usage?.output_tokens ??
        null;

    const totalTokens =
        usage?.totalTokens ??
        usage?.total_tokens ??
        (
            Number.isFinite(inputTokens) &&
            Number.isFinite(outputTokens)
                ? inputTokens + outputTokens
                : null
        );

    const estimatedCostUsd =
        Number.isFinite(inputTokens) &&
        Number.isFinite(outputTokens)
            ? Number(
                (
                    (inputTokens / 1_000_000) * 2 +
                    (outputTokens / 1_000_000) * 8
                ).toFixed(8)
            )
            : null;

    return {
        actualAnswer,
        rewrittenQuery,

        quality:
            evaluation.quality ?? null,

        retrievalScore:
            evaluation.retrieval ?? null,

        faithfulnessScore:
            evaluation.faithfulness ?? null,

        relevanceScore:
            evaluation.relevance ?? null,

        overallScore:
            overallScore !== null
                ? Number(
                    overallScore.toFixed(2)
                )
                : null,

        passed:
            evaluation.quality >= 6.75 &&
            evaluation.relevance >= 6.75 &&
            evaluation.faithfulness >= 6.75,

        reasoning:
            evaluation.reasoning ?? null,

        latencyMs,

        retrievedDocuments:
            documentContext.length,

        retrievedMemories:
            memoryContext.length,

        retrievedChats:
            chatContext.length,

        usage,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd
    };
}