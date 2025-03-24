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
        <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">保險產品比較助手</h1>
                <button
                    onClick={resetChat}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                    重置對話
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-lg shadow-inner">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`mb-4 p-4 rounded-lg ${
                    msg.role === 'user' 
                    ? 'bg-blue-100 border-blue-300 ml-auto' 
                    : 'bg-white border-gray-200 shadow-sm mr-auto'
                    } prose max-w-none`} // 将样式移动到这里
                    style={{ maxWidth: '90%' }}
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
                    <div className="text-gray-500 italic p-4">AI 正在分析中...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="輸入您的問題..."
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                >
                    傳送
                </button>
            </form>
        </div>
    );
};

export default Chat;