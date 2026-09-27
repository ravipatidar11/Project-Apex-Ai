import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Paperclip, Brain, X, FileText } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  onStop,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  memory,
  onMemoryChange,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || attachments.length) && !isLoading) {
        onSend();
      }
    }
  };

  const handleFiles = (event) => {
    const chosenFiles = Array.from(event.target.files || []);
    const supportedFiles = chosenFiles.filter((file) =>
      file.size <= 10 * 1024 * 1024 && /^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/(plain|markdown|csv)|audio\/(mpeg|mp4|wav|ogg|webm))$/.test(file.type)
    );
    const acceptedFiles = [];
    let totalSize = attachments.reduce((size, file) => size + file.size, 0);
    for (const file of supportedFiles) {
      if (attachments.length + acceptedFiles.length >= 5 || totalSize + file.size > 15 * 1024 * 1024) break;
      acceptedFiles.push(file);
      totalSize += file.size;
    }
    if (acceptedFiles.length !== chosenFiles.length) {
      setAttachmentError('Use supported files up to 10 MB each, 5 files and 15 MB total.');
    } else {
      setAttachmentError('');
    }
    onAddAttachments(acceptedFiles);
    event.target.value = '';
  };

  return (
    <div className="input-section">
      <div className="input-box-wrapper">
        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((file, index) => (
              <div className="attachment-chip" key={`${file.name}-${index}`}>
                <FileText size={15} />
                <span>{file.name}</span>
                <button type="button" onClick={() => onRemoveAttachment(index)} title="Remove attachment">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {memory !== null && (
          <label className="memory-editor">
            <span><Brain size={14} /> Saved memory for this browser</span>
            <textarea
              value={memory}
              maxLength={2000}
              onChange={(event) => onMemoryChange(event.target.value)}
              placeholder="Preferences and details Apex should remember across chats"
              rows={2}
            />
          </label>
        )}

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
          <div className="input-tools">
            <input
              ref={fileInputRef}
              className="file-input-hidden"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm"
              onChange={handleFiles}
            />
            <button type="button" className="input-tool-btn" onClick={() => fileInputRef.current?.click()} title="Attach images, audio, or documents">
              <Paperclip size={16} />
            </button>
            <button type="button" className="input-tool-btn" onClick={onMemoryChange} title="Edit saved memory">
              <Brain size={16} />
            </button>
            <span className="input-hints">Enter to send, Shift + Enter for new line</span>
          </div>

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
              disabled={!input.trim() && !attachments.length}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        {attachmentError && <div className="attachment-error" role="status">{attachmentError}</div>}
      </div>
    </div>
  );
}
