"use client";
import React, { useState } from 'react';

export default function Step2({ 
  formData, 
  availableSubtopics, 
  selectedSubtopics, 
  toggleSubtopic, 
  handleGenerateWords, 
  setFormData,
  setAvailableSubtopics, 
  loading,
  cancelGeneration,
  generationStats,
  t 
}) {
  const [customSubtopic, setCustomSubtopic] = useState('');
  const wordsCount = selectedSubtopics.length * formData.wordsPerSubtopic;

  const handleAddCustomSubtopic = (e) => {
    e.preventDefault();
    if (customSubtopic.trim()) {
      const topic = customSubtopic.trim();
      if (!availableSubtopics.includes(topic)) {
        setAvailableSubtopics(prev => [...prev, topic]);
      }
      if (!selectedSubtopics.includes(topic)) {
        toggleSubtopic(topic);
      }
      setCustomSubtopic('');
    }
  };

  const handleChange = (e) => {
    const { name, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : prev[name] 
    }));
  };

  return (
    <div className="brand-card">
      <h2>{t("step2_title")}</h2>
      <p className="subtitle">{t("step2_desc", { topic: formData.topic })}</p>

      <div className="flex-wrap">
        {availableSubtopics.map(subtopic => (
          <div 
            key={subtopic} 
            className={`topic-tag ${selectedSubtopics.includes(subtopic) ? "selected" : ""}`}
            onClick={() => toggleSubtopic(subtopic)}
          >
            {subtopic}
          </div>
        ))}
      </div>

      <form onSubmit={handleAddCustomSubtopic} style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder={t("placeholder_custom_subtopic") || "Add your own subtopic..."}
          value={customSubtopic}
          onChange={(e) => setCustomSubtopic(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="brand-btn" style={{ background: 'var(--brand-white)', border: '2px solid var(--brand-border)', color: 'var(--brand-teal)', marginTop: 0 }}>
          + {t("btn_add") || "Add"}
        </button>
      </form>

      <div style={{ marginBottom: '2.5rem' }}>
        <label>{t("label_words_per_subtopic")}</label>
        <input 
          type="number" 
          min="1" 
          max="500" 
          value={formData.wordsPerSubtopic}
          onChange={(e) => setFormData(prev => ({ ...prev, wordsPerSubtopic: parseInt(e.target.value) || 1 }))}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--brand-border)', fontFamily: 'inherit', fontSize: '1rem', marginTop: '0.5rem' }}
          required
        />
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="checkbox"
          id="preventDuplicates"
          name="preventDuplicates"
          checked={formData.preventDuplicates}
          onChange={handleChange}
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
        <label htmlFor="preventDuplicates" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '1rem' }}>
          {t("label_prevent_duplicates")}
        </label>
      </div>

      {loading && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="airbnb-progress-container" style={{ marginBottom: '1rem' }}>
            <div 
              className="airbnb-progress-fill" 
              style={{ width: `${Math.max(5, (generationStats?.cards / wordsCount) * 100)}%` }}
            />
          </div>
          <button type="button" className="brand-btn btn-ghost" onClick={cancelGeneration} style={{ width: '100%' }}>
            {t("btn_cancel") || "Cancel"}
          </button>
        </div>
      )}

      {!loading && (
        <button 
          className="brand-btn btn-primary" 
          onClick={handleGenerateWords}
          disabled={selectedSubtopics.length === 0}
        >
          {t("btn_generate_words", { count: wordsCount }) || `Generate ${wordsCount} Words`}
        </button>
      )}
    </div>
  );
}
