import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fontData, setFontData] = useState(null);
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
    const lines = content.split('\n');
    const blocks = [];
    let currentBlock = { type: 'text', data: [] };
    let inTable = false;

    lines.forEach((line) => {
      const isTableLine = line.trim().startsWith('|') && line.includes('|', 1);

      if (isTableLine) {
        if (!inTable) {
          if (currentBlock.data.length > 0) {
            blocks.push({ ...currentBlock, data: currentBlock.data.join('\n') });
          }
          currentBlock = { type: 'table', data: [] };
          inTable = true;
        }
        currentBlock.data.push(line.trim());
      } else {
        if (inTable) {
          blocks.push(currentBlock);
          currentBlock = { type: 'text', data: [] };
          inTable = false;
        }
        currentBlock.data.push(line);
      }
    });

    if (currentBlock.data.length > 0) {
      blocks.push({
        ...currentBlock,
        data: currentBlock.type === 'table' 
          ? currentBlock.data 
          : currentBlock.data.join('\n'),
      });
    }

    return blocks;
  };

  const parseTable = (tableLines) => {
    if (tableLines.length < 2) return { headers: [], body: [] };
    
    // Remove markdown table separator lines
    const filteredLines = tableLines.filter(line => !line.match(/^[\s|:-]+$/));

    const headers = filteredLines[0]
      .split('|')
      .slice(1, -1)
      .map(c => c.trim());

    const body = filteredLines.slice(1).map(line =>
      line.split('|')
        .slice(1, -1)
        .map(c => c.trim())
    );

    return { headers, body };
  };

  const generatePDF = (content) => {
    if (!fontData) {
      alert('字體正在加載中，請稍後再試');
      return;
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Add the font to the document
    doc.addFileToVFS('NotoSansCJKtc-Regular.ttf', fontData);
    doc.addFont('NotoSansCJKtc-Regular.ttf', 'NotoSansCJKtc', 'normal');
    doc.setFont('NotoSansCJKtc');

    const blocks = processContent(content);
    let yPosition = 20;

    const chineseSplit = (text, maxWidth = 190) => {
      const lines = [];
      let currentLine = '';
      
      text.split('').forEach((char) => {
        const testLine = currentLine + char;
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > maxWidth) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);
      return lines;
    };

    blocks.forEach((block) => {
      if (block.type === 'text') {
        const cleanedText = block.data
          .replace(/#{1,6}\s?/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`{3}[\s\S]*?`{3}/g, '')
          .replace(/-\s/g, '• ')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/(?:\\[rn]|[\r\n]+)+/g, '\n')
          .replace(/<\/?[^>]+(>|$)/g, '');

        cleanedText.split('\n').forEach((paragraph) => {
          const lines = chineseSplit(paragraph);
          lines.forEach((line) => {
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFontSize(8);
            doc.text(line, 15, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        });
      } else if (block.type === 'table') {
        const { headers, body } = parseTable(block.data);
        
        if (headers.length > 0 && body.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: body,
            styles: {
              font: 'NotoSansCJKtc',
              fontSize: 8,
              cellPadding: 2,
              valign: 'middle',
              overflow: 'linebreak',
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'normal'
            },
            margin: { left: 15 },
            theme: 'grid',
            didDrawPage: (data) => {
              yPosition = data.cursor.y + 10;
            }
          });
        }
      }
    });

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`頁面 ${i}/${totalPages}`, 190 - 10, 287, { align: 'right' });
    }

    const getHongKongTimestamp = () => {
      const now = new Date();
      
      // Format for Hong Kong time
      const options = {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
    
      // Get formatted parts
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const [
        { value: month },,
        { value: day },,
        { value: year },,
        { value: hour },,
        { value: minute },,
        { value: second }
      ] = formatter.formatToParts(now);
    
      return `${year}${month}${day}_${hour}${minute}${second}`;
    };
    
    // Modify the save line in generatePDF
    doc.save(`保險比較報告_${getHongKongTimestamp()}.pdf`);
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
      // const response = await fetch('http://localhost:8003/api/ds', {
      const response = await fetch('https://fastapi-production-98d5.up.railway.app/api/ds', {
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
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="輸入您的問題..."
            disabled={isLoading}
            className="message-input"
            rows={3}
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