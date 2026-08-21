import "dotenv/config";

export async function extractMemory(message, recentConversation = "") {

    const prompt = `
You are a memory extraction system for an AI assistant.

Your task is to determine whether the user's latest message contains one or more pieces of long-term information that would be useful to remember across future conversations.

Use the recent conversation ONLY to resolve references such as "it", "he", "she", "that", etc.

Remember ONLY durable information such as:
- Preferences
- Personal facts
- Skills
- Technologies used
- Education
- Career goals
- Projects
- Hobbies
- Interests
- Relationships
- Frequently recurring information

DO NOT remember:
- Greetings
- Thanks
- Temporary requests
- Questions
- One-time conversations
- Explanations
- Small talk
- Temporary emotions
- Random opinions unlikely to matter later

IMPORTANT RULES:

1. Extract EVERY durable fact.
2. EACH memory MUST represent EXACTLY ONE atomic fact.
3. Never combine multiple facts into a single memory.
4. If one sentence contains multiple independent facts, split them into separate memories.
5. Write every memory as a standalone factual sentence in third person.
6. Categories should be as specific as possible.

Examples of good categories:
- Favorite Color
- Favorite Database
- Favorite Framework
- Education
- Career Goal
- Technology
- Programming Language
- Hobby
- Interest
- Project

Avoid generic categories like:
- Preferences
- Personal
- General
- Miscellaneous

7. Tags should contain 3-8 useful keywords.

Examples

Input:
"I use React, MongoDB and Vite."

Output:
{
    "shouldRemember": true,
    "memories": [
        {
            "memory": "The user uses React.",
            "category": "Technology",
            "tags": ["react","frontend","javascript"]
        },
        {
            "memory": "The user uses MongoDB.",
            "category": "Technology",
            "tags": ["mongodb","database","nosql"]
        },
        {
            "memory": "The user uses Vite.",
            "category": "Technology",
            "tags": ["vite","build tool","frontend"]
        }
    ]
}

Input:
"I'm a Civil Engineering student at IIT Bhubaneswar."

Output:
{
    "shouldRemember": true,
    "memories": [
        {
            "memory": "The user studies Civil Engineering.",
            "category": "Education",
            "tags": ["civil engineering","major","student"]
        },
        {
            "memory": "The user studies at IIT Bhubaneswar.",
            "category": "Education",
            "tags": ["iit bhubaneswar","college","university"]
        }
    ]
}

Input:
"My favourite footballer is Cristiano Ronaldo."

Output:
{
    "shouldRemember": true,
    "memories": [
        {
            "memory": "The user's favourite footballer is Cristiano Ronaldo.",
            "category": "Favorite Footballer",
            "tags": ["ronaldo","football","favorite"]
        }
    ]
}

If nothing should be remembered:

{
    "shouldRemember": false,
    "memories": []
}

Return ONLY valid JSON.

Recent Conversation:
${recentConversation}

Latest User Message:
${message}
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
                    response_format: {
                        type: "json_object"
                    },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Memory extraction failed");
        }

        return JSON.parse(
            data.choices[0].message.content
        );

    } catch (err) {

        console.error("Memory Extraction Error:", err);

        return {
            shouldRemember: false,
            memories: []
        };

    }

}