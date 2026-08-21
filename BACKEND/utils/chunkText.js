export function chunkText(text, maxChunkSize = 1000) {

    const sentences = text
        .replace(/\r\n/g, "\n")
        .split(/(?<=[.!?])\s+/);

    const chunks = [];

    let currentChunk = "";

    for (const sentence of sentences) {

        if (
            currentChunk.length + sentence.length >
            maxChunkSize
        ) {

            chunks.push(currentChunk.trim());

            currentChunk = sentence + " ";

        } else {

            currentChunk += sentence + " ";

        }

    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}