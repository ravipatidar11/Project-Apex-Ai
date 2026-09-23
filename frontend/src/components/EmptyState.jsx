import React from 'react';
import { Code, Sparkles, Lightbulb, Compass, FileText } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: <Code size={20} style={{ color: '#6366f1' }} />,
    title: 'Write Python & FastAPI API',
    desc: 'Create a REST endpoint with SQLAlchemy database models',
    prompt: 'Write a Python FastAPI snippet to handle user registration with SQLAlchemy models.',
  },
  {
    icon: <Sparkles size={20} style={{ color: '#ec4899' }} />,
    title: 'Design CSS UI System',
    desc: 'Build a modern dark mode dashboard glassmorphic layout',
    prompt: 'Explain how to build a responsive glassmorphic UI using modern CSS custom variables.',
  },
  {
    icon: <Lightbulb size={20} style={{ color: '#f59e0b' }} />,
    title: 'Explain Complex Topics',
    desc: 'Break down quantum computing or database indexing simply',
    prompt: 'Explain how PostgreSQL database indexing works with B-Tree indexes using simple real-world analogies.',
  },
  {
    icon: <FileText size={20} style={{ color: '#10b981' }} />,
    title: 'Draft & Summarize Content',
    desc: 'Write technical documentation or professional emails',
    prompt: 'Draft a professional README document for a full-stack AI Chatbot application.',
  },
];

export default function EmptyState({ onSelectPrompt }) {
  return (
    <div className="empty-state">
      <div className="hero-icon">
        <Compass size={32} />
      </div>

      <h1 className="empty-title">Where curiosity meets intelligence</h1>
      <p className="empty-subtitle">
        Powered by Google Gemini API & FastAPI. Select a suggestion below or type your own question to start.
      </p>

      <div className="cards-grid">
        {SUGGESTIONS.map((card, idx) => (
          <div
            key={idx}
            className="prompt-card"
            onClick={() => onSelectPrompt(card.prompt)}
          >
            <div className="card-title">
              {card.icon}
              <span>{card.title}</span>
            </div>
            <div className="card-desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
