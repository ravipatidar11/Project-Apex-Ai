import React, { useState } from 'react';
import { Bot, User, Copy, Check, Sparkles } from 'lucide-react';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic Helper to render formatted code blocks vs standard markdown paragraphs
  const renderFormattedContent = (content) => {
    if (!content) return null;

    // Split code blocks demarcated by ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }

      // Code block content
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        value: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <CodeSnippet key={idx} language={part.language} code={part.value} />
        );
      }

      // Format text lines & inline bold/code/headings/lists
      const blocks = part.value.split(/\n\s*\n/);
      return (
        <div key={idx} className="markdown-body">
          {blocks.map((block, bIdx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            if (trimmed === '---' || trimmed === '***') {
              return <hr key={bIdx} className="markdown-hr" />;
            }
            if (trimmed.startsWith('### ')) {
              return <h3 key={bIdx}>{formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>;
            }
            if (trimmed.startsWith('## ')) {
              return <h2 key={bIdx}>{formatInlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h2>;
            }
            if (trimmed.startsWith('# ')) {
              return <h1 key={bIdx}>{formatInlineMarkdown(trimmed.replace(/^#\s+/, ''))}</h1>;
            }

            const lines = trimmed.split('\n');
            const isBulletList = lines.length > 0 && lines.every((l) => /^[\*\-]\s+/.test(l.trim()));
            if (isBulletList) {
              return (
                <ul key={bIdx} className="markdown-list">
                  {lines.map((line, lIdx) => (
                    <li key={lIdx}>
                      {formatInlineMarkdown(line.trim().replace(/^[\*\-]\s+/, ''))}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={bIdx}>
                {lines.map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {lIdx > 0 && <br />}
                    {formatInlineMarkdown(line)}
                  </React.Fragment>
                ))}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content-box">
        <div className="bubble">
          {renderFormattedContent(message.content)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span className="message-time">
            {message.timestamp 
              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : 'Just now'}
          </span>

          {!isUser && (
            <button 
              className="copy-btn" 
              onClick={handleCopyMessage} 
              title="Copy message response"
            >
              {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline formatting helper for **bold**, `code`, and links
function formatInlineMarkdown(text) {
  if (!text) return '';
  
  // Format bold **text**
  const boldParts = text.split(/\*\*(.*?)\*\*/g);
  return boldParts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    
    // Format inline `code`
    const codeParts = part.split(/`(.*?)`/g);
    return codeParts.map((cPart, cIndex) => {
      if (cIndex % 2 === 1) {
        return <code key={cIndex}>{cPart}</code>;
      }
      return cPart;
    });
  });
}

// Component for syntax-styled Code Snippet box
function CodeSnippet({ language, code }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-header">
        <span>{language || 'code'}</span>
        <button className="copy-btn" onClick={copyCode}>
          {copiedCode ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} />}
          <span>{copiedCode ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
