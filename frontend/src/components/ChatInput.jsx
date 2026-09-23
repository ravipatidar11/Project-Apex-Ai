import React, { useRef, useEffect } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';

export default function ChatInput({ input, setInput, onSend, isLoading, onStop }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  return (
    <div className="input-section">
      <div className="input-box-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask Apex AI anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />

        <div className="input-actions">
          <span className="input-hints">
            Press <strong>Enter ↵</strong> to send, <strong>Shift + Enter</strong> for new line
          </span>

          {isLoading ? (
            <button
              className="send-btn"
              onClick={onStop}
              style={{ background: '#ef4444' }}
              title="Stop Generation"
            >
              <Square size={16} fill="white" />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={onSend}
              disabled={!input.trim()}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
