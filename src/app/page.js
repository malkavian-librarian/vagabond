"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Step1, { EUROPEAN_LANGUAGES } from "@/components/generator/Step1";
import Step2 from "@/components/generator/Step2";
import Step3 from "@/components/generator/Step3";
import Step4 from "@/components/generator/Step4";
import { TRANSLATIONS } from "./locales";

export default function Page() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nativeLanguage: "English",
    targetLanguage: "Spanish",
    topic: "",
    subtopicCount: 5,
    wordsPerSubtopic: 15,
  });

  const [availableSubtopics, setAvailableSubtopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [generationStats, setGenerationStats] = useState({ cards: 0, audio: 0, images: 0, tokens: 0 });
  const [generatingProgress, setGeneratingProgress] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [dynamicTranslations, setDynamicTranslations] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("vagabond_translations");
    if (saved) setDynamicTranslations(JSON.parse(saved));
  }, []);

  const t = React.useMemo(() => (key, params = {}) => {
    const lang = formData.nativeLanguage || "English";
    const dict = TRANSLATIONS[lang] || dynamicTranslations[lang] || TRANSLATIONS["English"];
    let str = dict[key] || TRANSLATIONS["English"][key] || key;
    Object.keys(params).forEach(p => { str = str.replace(`{${p}}`, params[p]); });
    return str;
  }, [formData.nativeLanguage, dynamicTranslations]);

  useEffect(() => {
    const lang = formData.nativeLanguage;
    if (lang !== "English" && !TRANSLATIONS[lang] && !dynamicTranslations[lang]) {
      const translateUI = async () => {
        setIsTranslating(true);
        try {
          const res = await fetch("/api/translate-ui", {
            method: "POST",
            body: JSON.stringify({ targetLanguage: lang, baseDictionary: TRANSLATIONS["English"] }),
          });
          const data = await res.json();
          if (data.translation) {
            const newDicts = { ...dynamicTranslations, [lang]: data.translation };
            setDynamicTranslations(newDicts);
            localStorage.setItem("vagabond_translations", JSON.stringify(newDicts));
          }
        } catch (e) {
          console.error("UI Translation failed", e);
        } finally {
          setIsTranslating(false);
        }
      };
      translateUI();
    }
  }, [formData.nativeLanguage, dynamicTranslations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navLang = navigator.language.split('-')[0];
      const langMap = {
        'en':'English','es':'Spanish','fr':'French','de':'German','it':'Italian',
        'pt':'Portuguese','ru':'Russian','uk':'Ukrainian','pl':'Polish','nl':'Dutch',
        'el':'Greek','bg':'Bulgarian','cs':'Czech','da':'Danish','fi':'Finnish',
        'hu':'Hungarian','ro':'Romanian','sk':'Slovak','sv':'Swedish','ca':'Catalan',
        'hr':'Croatian','et':'Estonian','ga':'Irish','is':'Icelandic','lv':'Latvian',
        'lt':'Lithuanian','mk':'Macedonian','mt':'Maltese','sr':'Serbian','sl':'Slovenian',
        'sq':'Albanian','be':'Belarusian','bs':'Bosnian','gl':'Galician','cy':'Welsh'
      };
      if (langMap[navLang]) setFormData(prev => ({ ...prev, nativeLanguage: langMap[navLang] }));
    }
  }, []);

  const handleGenerateTopics = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAvailableSubtopics(data.subtopics);
      setSelectedSubtopics(data.subtopics.slice(0, Number(formData.subtopicCount) || 5));
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtopic = (subtopic) => {
    setSelectedSubtopics(prev => prev.includes(subtopic) ? prev.filter(t => t !== subtopic) : [...prev, subtopic]);
  };

  const handleGenerateDeck = async () => {
    setStep(3);
    setGeneratingProgress(selectedSubtopics.map(t => ({ topic: t, status: "pending" })));
    setGenerationStats({ cards: 0, audio: 0, images: 0, tokens: 0 });
    
    const allCards = [];
    const previouslyGeneratedWords = [];

    try {
      for (let i = 0; i < selectedSubtopics.length; i++) {
        const subtopic = selectedSubtopics[i];
        setGeneratingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: "active" } : item));

        const res = await fetch("/api/generate-topic-cards", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            subtopic,
            count: formData.wordsPerSubtopic,
            previouslyGeneratedWords
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const subtopicCards = data.cards.map(c => ({ ...c, subtopic }));
        allCards.push(...subtopicCards);
        previouslyGeneratedWords.push(...subtopicCards.map(c => c.target));

        setGenerationStats(prev => ({
          cards: prev.cards + subtopicCards.length,
          audio: prev.audio + data.audioGenerated,
          images: prev.images + data.imagesGenerated,
          tokens: prev.tokens + data.tokens
        }));

        setGeneratingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: "done", generatedCards: subtopicCards } : item));
      }

      const compileRes = await fetch("/api/compile-apkg", {
        method: "POST",
        body: JSON.stringify({ topic: formData.topic, cards: allCards }),
      });

      const blob = await compileRes.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setStep(4);
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  };

  return (
    <div className="brand-layout">
      <Navbar />
      <main className="container" style={{ position: 'relative' }}>
        {isTranslating && <div style={{ position: 'fixed', top: '100px', right: '20px', background: 'rgba(0, 184, 212, 0.1)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '12px', color: 'var(--brand-teal)', fontSize: '0.875rem', fontWeight: 'bold', zIndex: 100, border: '1px solid var(--brand-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="spinner-ring" style={{ width: '16px', height: '16px', borderTopColor: 'var(--brand-teal)' }}></div>
          Translating UI...
        </div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
        
        {step === 1 && <Step1 formData={formData} setFormData={setFormData} handleGenerateTopics={handleGenerateTopics} loading={loading} t={t} />}
        {step === 2 && <Step2 formData={formData} availableSubtopics={availableSubtopics} selectedSubtopics={selectedSubtopics} toggleSubtopic={toggleSubtopic} handleGenerateDeck={handleGenerateDeck} setFormData={setFormData} t={t} />}
        {step === 3 && <Step3 generatingProgress={generatingProgress} setStep={setStep} setGeneratingProgress={setGeneratingProgress} t={t} nativeLanguage={formData.nativeLanguage} />}
        {step === 4 && <Step4 generationStats={generationStats} downloadUrl={downloadUrl} formData={formData} setStep={setStep} setDownloadUrl={setDownloadUrl} t={t} />}
      </main>
    </div>
  );
}

