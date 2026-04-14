"use client";
import React, { useState, useEffect } from 'react';
import { STATUSES } from "./statuses";

export default function Step4Media({ 
  generatingProgress, 
  setStep, 
  setGeneratingProgress, 
  t, 
  nativeLanguage 
}) {
  const [funnyStatus, setFunnyStatus] = useState("");

  useEffect(() => {
    const list = STATUSES[nativeLanguage] || STATUSES["English"];
    let idx = 0;
    setFunnyStatus(list[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % list.length;
      setFunnyStatus(list[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [nativeLanguage]);

  const handleCancel = () => {
    setStep(1);
    setGeneratingProgress([]);
  };

  return (
    <div className="brand-card">
      <h2>{t("step4_media_title") || "Generating Missing Elements"}</h2>
      
      <div className="loader-container">
        <div className="spinner-ring"></div>
        <p style={{ fontWeight: '600', color: 'var(--brand-teal)' }}>{funnyStatus}</p>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
          {generatingProgress?.processedWords || 0} / {generatingProgress?.totalWords || 0} Words Processed
        </p>
        <div className="airbnb-progress-container">
          <div 
            className="airbnb-progress-fill" 
            style={{ 
              width: `${generatingProgress?.totalWords > 0 
                ? Math.max(5, (generatingProgress.processedWords / generatingProgress.totalWords) * 100) 
                : 5}%` 
            }}
          />
        </div>
      </div>

      <button className="brand-btn btn-ghost" onClick={handleCancel} style={{ marginTop: '3rem', width: '100%' }}>
        {t("btn_cancel")}
      </button>
    </div>
  );
}
