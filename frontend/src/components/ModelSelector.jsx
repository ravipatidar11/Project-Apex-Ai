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
    <div className="model-selector-wrapper">
      <select
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
        className="model-select"
        title="Select AI Model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#fff' }}>
            ⚡ {m.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="model-select-arrow" />
    </div>
  );
}
