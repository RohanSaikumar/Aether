import Memory from "../models/memories.js";

export async function retrieveMemories(
    thread,
    queryEmbedding,
    options = {}
) {
    const {
        topK = 5,
        similarityThreshold = 0.70
    } = options;

    const safeTopK = Math.min(topK, 10);

    const results = await Memory.aggregate([
        {
            $vectorSearch: {
                index: "memory_index",
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
                memory: 1,
                category: 1,
                tags: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);

    const filtered = results.filter(
        memory =>
            memory.score >= similarityThreshold
    );

    

    return filtered.map(memory => ({
        role: "system",
        content: memory.memory
    }));
}