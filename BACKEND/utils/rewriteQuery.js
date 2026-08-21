import "dotenv/config";

export async function rewriteQuery(messages, query) {

    const recentConversation = messages
        .slice(-6)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join("\n");

    const prompt = `
You are a query rewriter for a conversational memory retrieval system.

Your ONLY job is to rewrite the user's latest message into a natural, standalone sentence or question that can be embedded for semantic search.

You are NOT answering the user.

Rules:
- Preserve the user's original intent exactly.
- Do NOT answer the question.
- Do NOT explain the topic.
- Do NOT summarize the conversation.
- Do NOT convert the message into a generic knowledge question.
- Do NOT shorten the message into a title or keyword phrase.
- Resolve vague references such as "it", "that", "this", "he", "she", "they", etc. using the recent conversation.
- If the user's message is already clear and standalone, return it unchanged.
- Return ONLY the rewritten sentence or question.
- Do not include quotation marks or any additional text.

Examples:

Input:
I also use MongoDB btw

Output:
The user says they also use MongoDB.

--------------------

Input:
I like React.

Output:
The user says they like React.

--------------------

Input:
What's my favourite database?

Output:
Which database did the user previously say is their favourite?

--------------------

Input:
What framework do I use?

Output:
Which frontend framework did the user previously say they use?

--------------------

Input:
What about it?

Output:
What did the user previously say about React?

--------------------

Recent Conversation:
${recentConversation}

User Question:
${query}
`;

    try {

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4.1-nano",
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Query rewrite failed");
        }

        return data.choices[0].message.content.trim();

    } catch (err) {
        console.error(err);
        return query;
    }
}