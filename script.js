const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");

// Voice recognition setup
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "ml-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript;
        messageInput.value = spokenText;
        sendMessage();
    };

    recognition.onerror = function(event) {
        console.log("Voice error:", event.error);
    };

    voiceBtn.addEventListener("click", function() {
        recognition.start();
    });
} else {
    console.log("Speech recognition is not supported in this browser.");
}

// Let Miya speak her replies
function speakMiya(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ml-IN";
    speech.rate = 1;

    window.speechSynthesis.speak(speech);
}

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
        speakMiya(reply);


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