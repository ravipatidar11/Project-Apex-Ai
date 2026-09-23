import React from 'react';
import { Menu, Plus, Sparkles } from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function Header({ 
  currentChatTitle, 
  onToggleSidebar, 
  onNewChat, 
  selectedModel, 
  onSelectModel,
  isDbConnected 
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar} title="Toggle Sidebar">
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="header-title">
            {currentChatTitle || 'New Conversation'}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
        
        <button 
          onClick={onNewChat}
          className="new-chat-btn"
          style={{ margin: 0, padding: '8px 14px', fontSize: '0.85rem' }}
          title="Start New Chat"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}
