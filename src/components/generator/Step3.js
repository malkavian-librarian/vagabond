"use client";
import React, { useState, useEffect } from 'react';
import WordCloud from "@/components/ui/WordCloud";
import { STATUSES } from "./statuses";

export default function Step3({ 
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
      <h2>{t("step3_title")}</h2>
      
      <div className="loader-container">
        <div className="spinner-ring"></div>
        <p style={{ fontWeight: '600', color: 'var(--brand-teal)' }}>{funnyStatus}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {generatingProgress.map((item, i) => (
          <div key={i} style={{ borderBottom: i !== generatingProgress.length - 1 ? '1px solid var(--brand-border)' : 'none', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {item.status === "pending" && <div className="status-circle"></div>}
              {item.status === "active" && <div className="spinner-ring"></div>}
              {item.status === "done" && <div className="status-done">✓</div>}
              <span style={{ fontWeight: item.status === "active" ? '700' : '500' }}>{item.topic}</span>
            </div>
            
            {item.status === "done" && item.generatedCards && (
              <WordCloud words={item.generatedCards} />
            )}
          </div>
        ))}
      </div>

      <button className="brand-btn btn-ghost" onClick={handleCancel} style={{ marginTop: '3rem', width: '100%' }}>
        {t("btn_cancel")}
      </button>
    </div>
  );
}
