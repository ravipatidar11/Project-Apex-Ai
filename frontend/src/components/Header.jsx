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
          <Menu size={20} />
        </button>
        <div className="header-title-container">
          <Sparkles size={16} className="sparkle-icon" />
          <h2 className="header-title">
            {currentChatTitle || 'New Conversation'}
          </h2>
        </div>
      </div>

      <div className="header-right">
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
        
        <button 
          onClick={onNewChat}
          className="header-new-chat-btn"
          title="Start New Chat"
        >
          <Plus size={16} />
          <span className="new-chat-label">New Chat</span>
        </button>
      </div>
    </header>
  );
}
