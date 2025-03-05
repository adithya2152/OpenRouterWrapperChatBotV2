import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Chatbot = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false); // Loading state
    const [file, setFile] = useState(null); // Store uploaded file
    const chatContainerRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    // Handle Sending Messages
    const sendMessage = async () => {
        if (!input.trim() && !file) return; // Don't send empty messages

        const userMessage = { role: "user", content: input || "Uploaded a file" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            let response;
            if (file) {
                // Send file if uploaded
                const formData = new FormData();
                formData.append("file", file);
                formData.append("question", input || "Summarize this document");

                response = await axios.post("http://localhost:8000/upload/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                setFile(null); // Reset file input
            } else {
                // Send text message
                response = await axios.post("http://localhost:8000/chat", { message: input });
            }

            const botMessage = { role: "bot", content: response.data.reply };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [...prev, { role: "bot", content: "Error: Failed to get response" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.chatBox}>
                {/* Chatbot Header */}
                <div style={styles.header}>OpenRouter AI Chatbot</div>

                {/* Chat Messages */}
                <div ref={chatContainerRef} style={styles.chatMessages}>
                    {messages.map((msg, index) => (
                        <div key={index} style={msg.role === "user" ? styles.userMessageWrapper : styles.botMessageWrapper}>
                            <div style={msg.role === "user" ? styles.userMessage : styles.botMessage}>
                                <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && <div style={styles.loadingMessage}>Thinking...</div>}
                </div>

                {/* Input Box & File Upload */}
                <div style={styles.inputContainer}>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={styles.fileInput}
                    />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder={file ? "Enter a question for the file..." : "Type a message..."}
                        style={styles.input}
                    />
                    <button onClick={sendMessage} style={styles.sendButton} disabled={loading}>
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Inline Styles
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
    },
    chatBox: {
        width: "450px",
        backgroundColor: "#2C2C2C",
        borderRadius: "10px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        padding: "15px",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
    },
    header: {
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#FFFFFF",
        paddingBottom: "10px",
        borderBottom: "1px solid #444",
    },
    chatMessages: {
        flex: 1,
        overflowY: "auto",
        maxHeight: "400px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
    },
    userMessageWrapper: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "8px",
    },
    botMessageWrapper: {
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: "8px",
    },
    userMessage: {
        backgroundColor: "#4A90E2",
        color: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        maxWidth: "75%",
    },
    botMessage: {
        backgroundColor: "#555",
        color: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        maxWidth: "75%",
    },
    loadingMessage: {
        textAlign: "center",
        fontStyle: "italic",
        color: "#AAA",
        padding: "5px",
    },
    inputContainer: {
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid #444",
        paddingTop: "10px",
        marginTop: "10px",
    },
    fileInput: {
        marginBottom: "10px",
        color: "white",
    },
    input: {
        flex: 1,
        padding: "10px",
        borderRadius: "5px",
        border: "none",
        outline: "none",
        backgroundColor: "#444",
        color: "white",
    },
    sendButton: {
        marginTop: "10px",
        padding: "10px",
        border: "none",
        borderRadius: "5px",
        backgroundColor: "#4A90E2",
        color: "white",
        cursor: "pointer",
        fontWeight: "bold",
    },
};

export default Chatbot;
