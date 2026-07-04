import express from "express";
const app = express();
import "dotenv/config";

export async function openAIResponse(messages) {
    try {
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4.1",
                messages
            })
        };

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            options
        );

        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Response:", data);

        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown API error");
        }

        return data.choices[0].message.content;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
