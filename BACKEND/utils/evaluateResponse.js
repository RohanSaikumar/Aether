import "dotenv/config";

function normalizeScore(value) {
    const score = Number(value);

    if (!Number.isFinite(score)) return null;

    return Math.max(0, Math.min(10, score));
}

export async function evaluateResponse({
    question,
    expectedAnswer = "",
    answer,
    documentContext = [],
    memoryContext = [],
    chatContext = [],
    model = "gpt-4.1-mini"
}) {
    try {
        const assistantAnswer =
            typeof answer === "string"
                ? answer.trim()
                : String(answer ?? "").trim();

        if (!assistantAnswer) {
            throw new Error(
                "Cannot evaluate response: assistant answer is empty."
            );
        }

        const documentText = documentContext
            .map(doc => `DOCUMENT:\n${doc.content || ""}`)
            .join("\n\n-------------------------\n\n");

        const memoryText = memoryContext
            .map(mem => `MEMORY:\n${mem.content || ""}`)
            .join("\n\n-------------------------\n\n");

        const chatText = chatContext
            .map(
                chat =>
                    `HISTORICAL ${(chat.role || "message").toUpperCase()}:\n${chat.content || ""}`
            )
            .join("\n\n-------------------------\n\n");

        const evaluationPrompt = `
You are evaluating ONE specific AI response.

Only evaluate the text under "ASSISTANT ANSWER TO EVALUATE".

CURRENT USER QUESTION:
${question}
EXPECTED ANSWER:
${expectedAnswer || "No expected answer was provided."}

IMPORTANT GROUND-TRUTH MATCHING RULE:

When an expected answer is provided, determine whether the
ASSISTANT ANSWER TO EVALUATE reaches the same substantive
conclusion as the EXPECTED ANSWER.

Do NOT require exact wording.

Semantically equivalent answers must receive high QUALITY
and RELEVANCE scores.

For example:

Expected answer:
"18 or 19"

Answer:
"Based on the available information, the person is likely
18 or 19 years old."

This is a correct answer and should receive a high QUALITY
score and high RELEVANCE score.

Likewise, additional explanation, reasoning, uncertainty
phrasing such as "likely", "around", or "approximately", and
different sentence structure must NOT reduce the score when
the final substantive answer agrees with the expected answer.

The evaluator must focus on the conclusion of the assistant
answer, not punish the answer merely because it contains
additional reasoning.

Only reduce QUALITY when the assistant's substantive
conclusion actually contradicts or materially differs from
the expected answer.

ASSISTANT ANSWER TO EVALUATE:
${assistantAnswer}

RETRIEVED DOCUMENTS:
${documentText || "No documents were retrieved."}

RETRIEVED MEMORIES:
${memoryText || "No memories were retrieved."}

RETRIEVED HISTORICAL CHAT CONTEXT:
${chatText || "No historical chat context was retrieved."}

Score from 0 to 10.

QUALITY:
How well does the answer answer the current question?
When an expected answer exists, treat it as ground truth.

FAITHFULNESS:
Are factual claims supported by the retrieved context?

RELEVANCE:
Does the answer directly answer the current question?

RETRIEVAL:
How useful was the retrieved context?

If the assistant's substantive conclusion contradicts the
expected answer, quality should generally be 0–3.

If the assistant's conclusion semantically agrees with the
expected answer, quality should generally be 8–10 unless
there is another substantial problem with the answer.

Return ONLY valid JSON:

{
    "quality": 0,
    "faithfulness": 0,
    "relevance": 0,
    "retrieval": 0,
    "reasoning": "Brief explanation."
}
`;

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a strict AI response evaluator. Return only valid JSON."
                        },
                        {
                            role: "user",
                            content: evaluationPrompt
                        }
                    ],
                    temperature: 0,
                    response_format: {
                        type: "json_object"
                    }
                })
            }
        );

        if (!response.ok) {
            const data = await response.json();

            throw new Error(
                data.error?.message ||
                "Evaluation request failed."
            );
        }

        const data = await response.json();

        const content =
            data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error(
                "Evaluator returned no response."
            );
        }

        const evaluation = JSON.parse(content);

        const quality = normalizeScore(
            evaluation.quality
        );

        const faithfulness = normalizeScore(
            evaluation.faithfulness
        );

        const relevance = normalizeScore(
            evaluation.relevance
        );

        const retrieval = normalizeScore(
            evaluation.retrieval
        );

        if (
            quality === null ||
            faithfulness === null ||
            relevance === null ||
            retrieval === null
        ) {
            throw new Error(
                "Evaluator returned invalid scores."
            );
        }

        return {
            quality,
            faithfulness,
            relevance,
            retrieval,
            reasoning:
                evaluation.reasoning || ""
        };
    } catch (err) {
        console.error(
            "Response evaluation error:",
            err
        );

        throw err;
    }
}