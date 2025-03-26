import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IconButton, Switch, FormControlLabel } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fontData, setFontData] = useState(null);
  const [useChatApi, setUseChatApi] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadFont = async () => {
      try {
        const response = await fetch('/fonts/NotoSansCJKtc-Regular.ttf');
        if (!response.ok) throw new Error('Failed to fetch font file');
        const buffer = await response.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        setFontData(base64);
      } catch (error) {
        console.error('Failed to load font:', error);
      }
    };
    loadFont();
  }, []);

  const processContent = (content) => {
    // ... keep the existing processContent function unchanged ...
  };

  const parseTable = (tableLines) => {
    // ... keep the existing parseTable function unchanged ...
  };

  const generatePDF = (content) => {
    // ... keep the existing generatePDF function unchanged ...
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const apiUrl = useChatApi 
        ? 'https://fastapi-production-98d5.up.railway.app/api/chat'
        : 'https://fastapi-production-98d5.up.railway.app/api/ds';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessages),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Network response was not ok');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
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
        <IconButton
          edge="start"
          color="inherit"
          aria-label="back"
          onClick={() => (window.location.href = 'https://portal.aimarketings.io/tool-list/')}
          sx={{ color: '#ffffff', marginRight: '16px' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <h1>保險產品比較助手</h1>
      </div>

      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {msg.content}
            </ReactMarkdown>
            {msg.role === 'assistant' && (
              <div className="pdf-button-container">
                <button
                  className="pdf-button"
                  onClick={() => generatePDF(msg.content)}
                  title="導出為PDF"
                  disabled={!fontData}
                >
                  📥 保存報告
                </button>
              </div>
            )}
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
          <div className="api-switch-container">
            <FormControlLabel
              control={
                <Switch
                  checked={useChatApi}
                  onChange={(e) => setUseChatApi(e.target.checked)}
                  color="primary"
                />
              }
              label="使用聊天模式"
              labelPlacement="start"
            />
          </div>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="輸入您的問題..."
            disabled={isLoading}
            className="message-input"
            rows={3}
          />
          <div className="button-group">
            <button type="submit" disabled={isLoading}>
              傳送
            </button>
            <button type="button" onClick={resetChat}>
              重置對話
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;