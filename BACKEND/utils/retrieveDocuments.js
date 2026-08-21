import Document from "../models/documents.js";

export async function retrieveDocuments(
    thread,
    queryEmbedding,
    options = {}
) {
    const {
        topK = 5,
        similarityThreshold = 0.5
    } = options;

    const safeTopK = Math.min(topK, 10);

    const results = await Document.aggregate([
        {
            $vectorSearch: {
                index: "document_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates:
                    Math.max(100, safeTopK * 20),
                limit: safeTopK,
                filter: {
                    workspaceId: thread.workspaceId
                }
            }
        },
        {
            $project: {
                _id: 0,
                filename: 1,
                chunkNumber: 1,
                text: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);


   


    const filteredResults = results.filter(
        doc =>
            doc.score >= similarityThreshold
    );

    return filteredResults.map(doc => ({
        role: "system",
        content:
`Document: ${doc.filename}
Chunk ${doc.chunkNumber}

${doc.text}`
    }));
}