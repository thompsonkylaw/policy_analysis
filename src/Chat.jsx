import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMessages = [...messages, { role: 'user', content: inputMessage }];
        setMessages(newMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
            // const response = await fetch('http://localhost:8002/api/chat', {
            const response = await fetch('https://fastapi-production-98d5.up.railway.app/api/chat', {    
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessages),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Network response was not ok');
            }
            
            const data = await response.json();
            setMessages([...newMessages, { 
                role: 'assistant', 
                content: data.message 
            }]);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const resetChat = () => {
        setMessages([]);
    };

    const MarkdownComponents = {
        table: ({ children }) => (
            <div className="overflow-x-auto">
                <table className="markdown-table">{children}</table>
            </div>
        ),
    };

    return (
        <div className="App">
          <div className="header">
            <h1>保險產品比較助手</h1>
          </div>
          
          <div className="chat-container">
            {messages.map((msg, index) => (
                <div
                key={index}
                className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                >
                    {msg.content}
                </ReactMarkdown>
                </div>
            ))}
            
            {isLoading && (
            <div className="loading-text">
                產品比較助手 正在分析中
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
            </div>
            )}
            <div ref={messagesEndRef} />
          </div>
    
          <div className="input-container">
          <form onSubmit={handleSubmit}>
            <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="輸入您的問題..."
                disabled={isLoading}
                className="message-input"
                rows={3} // Set initial number of rows
            />
              <button type="submit" disabled={isLoading}>
                傳送
              </button>
              <button type="button" onClick={resetChat}>
                重置對話
              </button>
            </form>
          </div>
        </div>
      );
    };


export default Chat;