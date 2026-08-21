import Embedding from "../models/embeddings.js";

export async function retrieveChats(
    thread,
    queryEmbedding,
    options = {}
) {
    const {
        topK = 5,
        similarityThreshold = 0.60
    } = options;

    const safeTopK = Math.min(topK, 10);

    const results = await Embedding.aggregate([
        {
            $vectorSearch: {
                index: "embedding_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates:
                    Math.max(100, safeTopK * 20),
                limit: safeTopK,
                filter: {
                    threadId: thread.threadId
                }
            }
        },
        {
            $project: {
                _id: 0,
                messageNumber: 1,
                role: 1,
                content: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);

    

    const filteredResults = results.filter(
        memory =>
            memory.score >= similarityThreshold
    );

    const memoryContext = [];

    for (const memory of filteredResults) {
        const start = Math.max(
            0,
            memory.messageNumber - 1
        );

        const end = Math.min(
            thread.messages.length - 1,
            memory.messageNumber + 1
        );

        for (let i = start; i <= end; i++) {
            memoryContext.push(
                thread.messages[i]
            );
        }
    }

    return memoryContext;
}