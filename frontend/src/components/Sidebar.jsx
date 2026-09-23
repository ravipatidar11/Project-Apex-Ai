import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Zap, X, Search } from 'lucide-react';

export default function Sidebar({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  isOpen, 
  onClose,
  isDbConnected
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter((c) =>
    (c.title || 'New Chat').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Zap size={20} />
            </div>
            <span className="brand-title">Apex AI</span>
          </div>

          <button 
            className="mobile-toggle" 
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={() => { onNewChat(); onClose(); }}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Search bar */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px'
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div className="chat-history-container">
          <div className="chat-history-label">Recent Chats</div>
          
          {filteredChats.length === 0 ? (
            <div style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No chat history found
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                >
                  <MessageSquare size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                  <span className="history-title" title={chat.title}>
                    {chat.title || 'New Chat'}
                  </span>
                  
                  <button
                    className="delete-btn"
                    title="Delete Chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="sidebar-footer">
          <span>Backend Status</span>
          <div className={`status-badge ${!isDbConnected ? 'disconnected' : ''}`}>
            <span className="status-dot" />
            <span>{isDbConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
