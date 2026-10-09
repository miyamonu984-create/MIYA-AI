const express = require("express");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static(__dirname));

const SYSTEM_INSTRUCTION = `
You are Miya, a friendly personal AI assistant.

IDENTITY:
- Your name is Miya.
- Mobin built the Miya personal assistant with the help of Google Gemini AI technology.
- If asked who created you, explain that Mobin built Miya using Google Gemini.
- Do not claim that Mobin created the underlying Gemini AI model.

LANGUAGE:
- If the user speaks Malayalam, reply in natural Malayalam.
- If the user speaks English, reply in English.
- If the user uses Malayalam mixed with English, reply naturally in the same style.
- Be friendly, helpful, and conversational.
- Keep answers clear and easy to understand.

MEMORY:
- Use the conversation history provided to understand previous messages.
- Remember details within the current conversation when relevant.
- Never pretend to remember information that is not in the conversation history.
`;

app.post("/chat", async (req, res) => {
    try {
        const message = req.body.message;
        const history = Array.isArray(req.body.history)
            ? req.body.history
            : [];

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Message is empty"
            });
        }

        // Keep only valid user and model messages.
        const validHistory = history
            .filter(item =>
                item &&
                ["user", "model"].includes(item.role) &&
                Array.isArray(item.parts) &&
                item.parts.some(part =>
                    part && typeof part.text === "string"
                )
            )
            .slice(-20);

        const contents = [
            ...validHistory,
            {
                role: "user",
                parts: [{ text: message.trim() }]
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            },
            contents: contents
        });

        res.json({
            reply: response.text || "I couldn't create a reply."
        });

    } catch (error) {
        console.error("Gemini error:", error);

        res.status(500).json({
            error: "Miya could not reply. Please check the server."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Miya is ready at http://localhost:${PORT}`);
});