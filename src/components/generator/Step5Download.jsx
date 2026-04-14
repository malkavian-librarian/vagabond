"use client";
import React from 'react';

export default function Step5Download({ 
  generationStats, 
  downloadUrl, 
  formData, 
  setStep, 
  setDownloadUrl, 
  t 
}) {
  const handleRestart = () => {
    setStep(1);
    setDownloadUrl(null);
  };

  return (
    <div className="brand-card">
      <h2 style={{ textAlign: 'center' }}>{t("step5_title") || "Deck Ready!"}</h2>
      <p className="subtitle" style={{ textAlign: 'center' }}>{t("step5_desc") || "Your Anki package is compiled and ready to use."}</p>

      <div className="summary-box">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ borderBottom: '1px solid var(--brand-border)', paddingBottom: '0.5rem' }}>
            <label>{t("stat_cards")}</label>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-teal)' }}>{generationStats.cards}</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--brand-border)', paddingBottom: '0.5rem' }}>
            <label>{t("stat_audio")}</label>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-teal)' }}>{generationStats.audio}</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--brand-border)', paddingBottom: '0.5rem' }}>
            <label>{t("stat_images")}</label>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-teal)' }}>{generationStats.images}</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--brand-border)', paddingBottom: '0.5rem' }}>
            <label>{t("stat_tokens")}</label>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-teal)' }}>{generationStats.tokens.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {downloadUrl && (
        <a 
          href={downloadUrl} 
          download={`Vagabond-${formData.topic.replace(/\s+/g, '_')}.apkg`} 
          style={{ textDecoration: 'none' }}
        >
          <button className="brand-btn btn-primary" style={{ width: '100%' }}>
            {t("btn_download")}
          </button>
        </a>
      )}

      {downloadUrl && (
        <div className="summary-box import-guide">
          <h3 style={{ marginBottom: '1.5rem' }}>{t("import_guide_title")}</h3>
          <div className="import-step">
            <div className="step-number">1</div>
            <p>{t("import_step_1")}</p>
          </div>
          <div className="import-step">
            <div className="step-number">2</div>
            <p>{t("import_step_2")}</p>
          </div>
          <div className="import-step">
            <div className="step-number">3</div>
            <p>{t("import_step_3")}</p>
          </div>
        </div>
      )}

      <button className="brand-btn btn-ghost" onClick={handleRestart} style={{ width: '100%', marginTop: '1rem' }}>
        {t("btn_restart")}
      </button>
    </div>
  );
}
