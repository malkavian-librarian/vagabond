"use client";
import React, { useState } from 'react';
import { Plus, Trash2, Cpu } from 'lucide-react';

export default function ModelsView({ models, onAddModel, onDeleteModel, t }) {
  const [newModelId, setNewModelId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newModelId.trim()) {
      onAddModel(newModelId.trim());
      setNewModelId('');
    }
  };

  return (
    <div className="models-container brand-card">
      <div className="history-header">
        <div>
          <h2>{t("models_title") || "Model Management"}</h2>
          <p className="subtitle">{t("models_subtitle") || "Add custom OpenRouter model strings to use in your generation flow."}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="e.g. openai/gpt-4o or anthropic/claude-3-opus"
          value={newModelId}
          onChange={(e) => setNewModelId(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="brand-btn btn-primary" style={{ width: 'auto', marginTop: 0 }}>
          <Plus size={20} />
          {t("btn_add_model") || "Add Model"}
        </button>
      </form>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>{t("th_model_id") || "Model ID"}</th>
              <th style={{ width: '100px', textAlign: 'center' }}>{t("th_actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {models && models.length > 0 ? (
              models.map((model, idx) => (
                <tr key={model.modelId || idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Cpu size={18} style={{ color: 'var(--brand-teal)' }} />
                      <span style={{ fontWeight: 600 }}>{model.modelId}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="brand-btn btn-danger-ghost"
                      style={{ padding: '0.5rem', marginTop: 0 }}
                      onClick={() => onDeleteModel(model.modelId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '3rem', color: 'var(--brand-muted)' }}>
                  {t("no_custom_models") || "No models added yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
