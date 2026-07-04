import "dotenv/config";

export async function getEmbedding(text) {
    try {
        const response = await fetch(
            "https://api.openai.com/v1/embeddings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "text-embedding-3-large",
                    input: text,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Embedding failed");
        }

        return data.data[0].embedding;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

