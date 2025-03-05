import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Chatbot = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to latest message
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");

        try {
            const response = await axios.post("https://my-fast-api-ba5i.onrender.com/chat", {
                message: input,
            });

            const botMessage = {
                role: "bot",
                content: response.data.reply,
            };
            setMessages([...newMessages, botMessage]);
        } catch (error) {
            console.error("Error:", error);
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
                </div>

                {/* Input Box */}
                <div style={styles.inputContainer}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        style={styles.input}
                    />
                    <button onClick={sendMessage} style={styles.sendButton}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

// Inline Styles (Updated for Centering)
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        // backgroundColor: "#1E1E1E",
    },
    chatBox: {
        width: "400px",
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
    h1:
    {
        color: "#FFFFFF",
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        marginBottom: "10px",
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
    inputContainer: {
        display: "flex",
        borderTop: "1px solid #444",
        paddingTop: "10px",
        marginTop: "10px",
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
        marginLeft: "10px",
        padding: "10px 15px",
        border: "none",
        borderRadius: "5px",
        backgroundColor: "#4A90E2",
        color: "white",
        cursor: "pointer",
        fontWeight: "bold",
    },
};

export default Chatbot;
