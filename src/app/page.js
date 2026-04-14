"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Step1 from "@/components/generator/Step1";
import { TRANSLATIONS } from "./locales";
import { useGeneratorPipeline } from "@/hooks/useGeneratorPipeline";
import dynamic from "next/dynamic";
import "./history.css";

const Step2 = dynamic(() => import("@/components/generator/Step2"), { ssr: false });
const Step3Review = dynamic(() => import("@/components/generator/Step3Review"), { ssr: false });
const Step4Media = dynamic(() => import("@/components/generator/Step4Media"), { ssr: false });
const Step5Download = dynamic(() => import("@/components/generator/Step5Download"), { ssr: false });
const HistoryView = dynamic(() => import("@/components/history/HistoryView"), { ssr: false });
const ModelsView = dynamic(() => import("@/components/models/ModelsView"), { ssr: false });
const ErrorsView = dynamic(() => import("@/components/errors/ErrorsView"), { ssr: false });
import "./history.css";

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
    preventDuplicates: true,
  });

  const [availableSubtopics, setAvailableSubtopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [generatedWords, setGeneratedWords] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [dynamicTranslations, setDynamicTranslations] = useState({});
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("generator");
  const [activeModel, setActiveModel] = useState("qwen/qwen-2.5-72b-instruct");
  const [models, setModels] = useState([]);

  useEffect(() => {
    const savedTranslations = localStorage.getItem("vagabond_translations");
    if (savedTranslations) setDynamicTranslations(JSON.parse(savedTranslations));
    
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    fetchHistory();

    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
          const savedModel = localStorage.getItem("vagabond_active_model");
          if (savedModel && data.find(m => m.modelId === savedModel)) {
            setActiveModel(savedModel);
          } else {
            setActiveModel(data[0].modelId);
          }
        }
      } catch (e) {
        console.error("Failed to fetch custom models", e);
      }
    };
    fetchModels();
  }, [activeTab]);

  useEffect(() => {
    if (activeModel) {
      localStorage.setItem("vagabond_active_model", activeModel);
    }
  }, [activeModel]);

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

  const toggleSubtopic = (subtopic) => {
    setSelectedSubtopics(prev => prev.includes(subtopic) ? prev.filter(t => t !== subtopic) : [...prev, subtopic]);
  };

  const {
    loading: hookLoading,
    generationStats,
    generatingProgress,
    handleGenerateTopics,
    handleGenerateWords,
    handleGenerateMediaAndCompile
  } = useGeneratorPipeline({
    formData, activeModel, generatedWords, setGeneratedWords, 
    selectedSubtopics, setAvailableSubtopics, setSelectedSubtopics, 
    history, setHistory, setDownloadUrl, setStep, setError
  });

  const handleClearHistory = async () => {
    try {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear history", e);
    }
  };

  const handleAddModel = async (modelId) => {
    try {
      await fetch("/api/models", { 
        method: "POST", 
        body: JSON.stringify({ modelId }) 
      });
      setModels(prev => [...prev.filter(m => m.modelId !== modelId), { modelId, custom: true }]);
    } catch (e) {
      console.error("Failed to add model", e);
    }
  };

  const handleDeleteModel = async (modelId) => {
    try {
      await fetch("/api/models", { 
        method: "DELETE", 
        body: JSON.stringify({ modelId }) 
      });
      setModels(prev => {
        const newModels = prev.filter(m => m.modelId !== modelId);
        if (activeModel === modelId) {
          setActiveModel(newModels.length > 0 ? newModels[0].modelId : "");
        }
        return newModels;
      });
    } catch (e) {
      console.error("Failed to delete model", e);
    }
  };

  return (
    <div className="brand-layout">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeModel={activeModel}
        setActiveModel={setActiveModel}
        allModels={models}
        t={t} 
      />
      <main className="container" style={{ position: 'relative' }}>
        {isTranslating && <div style={{ position: 'fixed', top: '100px', right: '20px', background: 'rgba(0, 184, 212, 0.1)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '12px', color: 'var(--brand-teal)', fontSize: '0.875rem', fontWeight: 'bold', zIndex: 100, border: '1px solid var(--brand-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="spinner-ring" style={{ width: '16px', height: '16px', borderTopColor: 'var(--brand-teal)' }}></div>
          Translating UI...
        </div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
        
        {activeTab === 'generator' && (
          <>
            {step === 1 && <Step1 formData={formData} setFormData={setFormData} handleGenerateTopics={handleGenerateTopics} loading={loading || hookLoading} t={t} />}
            {step === 2 && <Step2 formData={formData} availableSubtopics={availableSubtopics} selectedSubtopics={selectedSubtopics} toggleSubtopic={toggleSubtopic} handleGenerateWords={handleGenerateWords} setFormData={setFormData} setAvailableSubtopics={setAvailableSubtopics} loading={loading || hookLoading} generationStats={generationStats} t={t} />}
            {step === 3 && <Step3Review generatedWords={generatedWords} setGeneratedWords={setGeneratedWords} handleGenerateMediaAndCompile={handleGenerateMediaAndCompile} t={t} />}
            {step === 4 && <Step4Media generatingProgress={generatingProgress} setStep={setStep} setGeneratingProgress={setGeneratingProgress} t={t} nativeLanguage={formData.nativeLanguage} />}
            {step === 5 && <Step5Download generationStats={generationStats} downloadUrl={downloadUrl} formData={formData} setStep={setStep} setDownloadUrl={setDownloadUrl} t={t} />}
          </>
        )}
        
        {activeTab === 'history' && (
          <HistoryView history={history} onClear={handleClearHistory} t={t} />
        )}

        {activeTab === 'models' && (
          <ModelsView 
            models={models} 
            onAddModel={handleAddModel} 
            onDeleteModel={handleDeleteModel} 
            t={t} 
          />
        )}
        
        {activeTab === 'errors' && (
          <ErrorsView t={t} />
        )}
      </main>
    </div>
  );
}

