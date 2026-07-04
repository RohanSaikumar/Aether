import Embedding from "../models/embeddings.js";
import { getEmbedding } from "./embeddings.js";

export async function retrieveMemories(thread, query) {

    const queryEmbedding = await getEmbedding(query);

    const results = await Embedding.aggregate([
        {
            $vectorSearch: {
                index: "embedding_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: 100,
                limit: 5,
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
                content: 1
            }
        }
    ]);
    
    const memoryContext = [];

    for (const memory of results) {

        const start = Math.max(0, memory.messageNumber - 1);
        const end = Math.min(thread.messages.length - 1, memory.messageNumber + 1);

        for (let i = start; i <= end; i++) {
            memoryContext.push(thread.messages[i]);
        }
    }

    return memoryContext;
}