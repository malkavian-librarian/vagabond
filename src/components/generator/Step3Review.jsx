"use client";
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Step3Review({ 
  generatedWords, 
  setGeneratedWords, 
  handleGenerateMediaAndCompile, 
  t 
}) {
  const toggleCheckbox = (id) => {
    setGeneratedWords(prev => prev.map(word => 
      word.id === id ? { ...word, selected: !word.selected } : word
    ));
  };

  const handleToggleAll = () => {
    const allSelected = generatedWords.every(w => w.selected !== false);
    setGeneratedWords(prev => prev.map(word => ({ ...word, selected: !allSelected })));
  };

  const selectedCount = generatedWords.filter(w => w.selected !== false).length;
  const totalCount = generatedWords.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="brand-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>{t("step3_review_title") || "Review Vocabulary"}</h2>
      <p className="subtitle">
        {t("step3_review_desc") || "Uncheck any words you don't want to include in your Anki deck. This saves processing time and API tokens."}
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={handleToggleAll} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--brand-teal)', 
            cursor: 'pointer', 
            fontWeight: '600',
            textDecoration: 'underline'
          }}
        >
          {allSelected ? (t("btn_deselect_all") || "Deselect All") : (t("btn_select_all") || "Select All")}
        </button>
      </div>

      <div className="history-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '2rem' }}>
        <table className="history-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--brand-white)' }}>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>✓</th>
              <th>{t("th_target_word") || "Target"}</th>
              <th>{t("th_native_translation") || "Native"}</th>
              <th>{t("th_subtopic") || "Subtopic"}</th>
            </tr>
          </thead>
          <tbody>
            {generatedWords.map(word => (
              <tr key={word.id} style={{ opacity: word.selected ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={word.selected !== false} 
                    onChange={() => toggleCheckbox(word.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <div style={{ color: 'var(--brand-teal)', fontWeight: '800', fontSize: '1.1rem' }}>
                    {word.target}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600' }}>{word.native}</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{word.subtopic}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button 
        className="brand-btn btn-primary" 
        onClick={handleGenerateMediaAndCompile}
        disabled={selectedCount === 0}
      >
        {t("btn_generate_media", { count: selectedCount }) || `Generate Media & Compile (${selectedCount} words)`}
      </button>
    </div>
  );
}
