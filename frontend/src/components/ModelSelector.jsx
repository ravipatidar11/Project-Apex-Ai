import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Latest' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
];

const GROQ_MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B · Groq' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B · Groq' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B Vision · Groq' },
];

const STATUS_LABELS = {
  unknown: 'Not checked',
  checking: 'Checking…',
  available: 'Available',
  quota_limited: 'Quota limited',
  busy: 'Temporarily busy',
  unavailable: 'Unavailable',
  error: 'Check failed',
};

export default function ModelSelector({ selectedModel, onSelectModel, modelStatuses = {}, aiProvider = 'gemini' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const models = aiProvider === 'groq' ? GROQ_MODELS : MODELS;
  const selected = models.find((model) => model.id === selectedModel)
    || (selectedModel ? { id: selectedModel, name: selectedModel } : models[0]);
  const selectedStatus = modelStatuses[selected.id]?.status || 'unknown';

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const chooseModel = (modelId) => {
    onSelectModel(modelId);
    setIsOpen(false);
  };

  return (
    <div className="model-selector-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="model-select"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`${selected.name} · ${STATUS_LABELS[selectedStatus] || STATUS_LABELS.unknown}`}
      >
        <span className="model-select-name">⚡ {selected.name}</span>
        <span className={`model-status-dot model-status-${selectedStatus}`} aria-hidden="true" />
        <ChevronDown size={14} className={`model-select-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="model-menu" role="listbox" aria-label={`Choose a ${aiProvider === 'groq' ? 'Groq' : 'Gemini'} model`}>
          {models.map((model) => {
            const status = modelStatuses[model.id]?.status || 'unknown';
            const checkedAt = modelStatuses[model.id]?.checkedAt;
            const statusTitle = checkedAt
              ? `Last checked ${new Date(checkedAt).toLocaleString()}`
              : 'No API check yet';
            return (
              <button
                type="button"
                key={model.id}
                className={`model-option ${model.id === selected.id ? 'selected' : ''}`}
                onClick={() => chooseModel(model.id)}
                role="option"
                aria-selected={model.id === selected.id}
              >
                <span className="model-option-name">⚡ {model.name}</span>
                <span className={`model-status-label model-status-${status}`} title={statusTitle}>
                  <span className="model-status-dot" aria-hidden="true" />
                  {STATUS_LABELS[status] || STATUS_LABELS.unknown}
                </span>
              </button>
            );
          })}
          <p className="model-status-note">Status shows the last API result and can change with quota limits. Models not tried yet show “Not checked”.</p>
        </div>
      )}
    </div>
  );
}
