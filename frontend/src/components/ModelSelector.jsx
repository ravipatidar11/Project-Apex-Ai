import React from 'react';
import { Cpu, ChevronDown } from 'lucide-react';

const MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', badge: 'Fast & High Quota' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Latest', badge: 'Ultra Fast' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', badge: 'Balanced' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'High Quality' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Daily Limit Reached' },
];

export default function ModelSelector({ selectedModel, onSelectModel }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
        style={{
          appearance: 'none',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          padding: '6px 32px 6px 12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#fff' }}>
            ⚡ {m.name} ({m.badge})
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--text-muted)'
        }}
      />
    </div>
  );
}
