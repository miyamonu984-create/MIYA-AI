const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Stores conversation history while this page remains open.
let conversationHistory = [];

async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || sendBtn.disabled) return;

    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.textContent = text;
    chat.appendChild(userMessage);

    messageInput.value = "";
    sendBtn.disabled = true;

    const aiMessage = document.createElement("div");
    aiMessage.className = "message ai";
    aiMessage.textContent = "Miya is thinking...";
    chat.appendChild(aiMessage);

    chat.scrollTop = chat.scrollHeight;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text,
                history: conversationHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Server error");
        }

        const reply = data.reply || "Miya received an empty reply.";
        aiMessage.textContent = reply;

        // Save both messages for the next turn.
        conversationHistory.push(
            {
                role: "user",
                parts: [{ text: text }]
            },
            {
                role: "model",
                parts: [{ text: reply }]
            }
        );

        // Keep the latest 20 messages in memory.
        conversationHistory = conversationHistory.slice(-20);

    } catch (error) {
        aiMessage.textContent = "Sorry! " + error.message;
        console.error("Miya error:", error);
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
        chat.scrollTop = chat.scrollHeight;
    }
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});