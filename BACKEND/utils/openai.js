import "dotenv/config";

export async function openAIResponse(messages, onChunk) {

    try {

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },

                body: JSON.stringify({
                    model: "gpt-4.1",
                    messages,
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: true,

                    stream_options: {
                        include_usage: true
                    }
                })
            }
        );

        if (!response.ok) {

            const data = await response.json();

            throw new Error(
                data.error?.message ||
                "OpenAI request failed"
            );

        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let fullResponse = "";

        let usage = null;

        while (true) {

            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
                stream: true
            });

            const events = buffer.split("\n\n");

            buffer = events.pop();

            for (const event of events) {

                const lines = event.split("\n");

                for (const line of lines) {

                    if (!line.startsWith("data: ")) {
                        continue;
                    }

                    const data = line.slice(6);

                    if (data === "[DONE]") {
                        continue;
                    }

                    try {

                        const parsed = JSON.parse(data);

                        // Capture final token usage
                        if (parsed.usage) {

                            usage = {
                                inputTokens:
                                    parsed.usage.prompt_tokens,

                                outputTokens:
                                    parsed.usage.completion_tokens,

                                totalTokens:
                                    parsed.usage.total_tokens
                            };

                        }

                        const content =
                            parsed.choices?.[0]?.delta?.content;

                        if (content) {

                            fullResponse += content;

                            onChunk(content);

                        }

                    } catch (err) {

                        console.error(
                            "Failed to parse OpenAI chunk:",
                            err
                        );

                    }

                }

            }

        }

        return {
            text: fullResponse,
            usage
        };

    } catch (err) {

        console.error(
            "OpenAI streaming error:",
            err
        );

        throw err;

    }

}