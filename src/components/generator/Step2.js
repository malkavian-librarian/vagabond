"use client";

export default function Step2({ 
  formData, 
  availableSubtopics, 
  selectedSubtopics, 
  toggleSubtopic, 
  handleGenerateDeck, 
  setFormData, 
  t 
}) {
  const wordsCount = selectedSubtopics.length * formData.wordsPerSubtopic;

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

      <div style={{ marginBottom: '2.5rem' }}>
        <label>{t("label_words_per_subtopic")}: {formData.wordsPerSubtopic}</label>
        <input 
          type="range" 
          min="10" 
          max="50" 
          step="5" 
          value={formData.wordsPerSubtopic}
          onChange={(e) => setFormData(prev => ({ ...prev, wordsPerSubtopic: parseInt(e.target.value) }))}
        />
      </div>

      <button 
        className="brand-btn btn-primary" 
        onClick={handleGenerateDeck}
        disabled={selectedSubtopics.length === 0}
      >
        {t("btn_generate", { count: wordsCount })}
      </button>
    </div>
  );
}
