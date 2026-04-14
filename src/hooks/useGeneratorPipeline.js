"use client";
import { useState } from "react";

export function useGeneratorPipeline({ formData, activeModel, generatedWords, setGeneratedWords, selectedSubtopics, setAvailableSubtopics, setSelectedSubtopics, history, setHistory, setDownloadUrl, setStep, setError }) {
  const [loading, setLoading] = useState(false);
  const [generationStats, setGenerationStats] = useState({ cards: 0, audio: 0, images: 0, tokens: 0 });
  const [generatingProgress, setGeneratingProgress] = useState({ totalWords: 0, processedWords: 0 });

  const handleGenerateTopics = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        body: JSON.stringify({ ...formData, model: activeModel }),
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

  const handleGenerateWords = async () => {
    setLoading(true);
    setError("");
    const allWords = [];
    const previouslyGeneratedWords = [];
    setGenerationStats({ cards: 0, audio: 0, images: 0, tokens: 0 });

    if (formData.preventDuplicates) {
      const historicalWords = history
        .filter(entry => entry.targetLanguage === formData.targetLanguage)
        .reverse()
        .slice(0, 500)
        .map(entry => entry.word);
      previouslyGeneratedWords.push(...historicalWords);
    }

    try {
      for (const subtopic of selectedSubtopics) {
        const res = await fetch("/api/generate-words", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            subtopic,
            count: formData.wordsPerSubtopic,
            previouslyGeneratedWords,
            model: activeModel
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        allWords.push(...data.cards);
        previouslyGeneratedWords.push(...data.cards.map(c => c.target));
        
        setGenerationStats(prev => ({ 
          ...prev, 
          cards: prev.cards + data.cards.length,
          tokens: prev.tokens + data.tokens 
        }));
      }
      setGeneratedWords(allWords);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMediaAndCompile = async () => {
    setStep(4);
    
    const wordsToProcess = generatedWords.filter(w => w.selected !== false);
    setGeneratingProgress({ totalWords: wordsToProcess.length, processedWords: 0 });
    const finalCards = [];

    setGenerationStats(prev => ({ ...prev, audio: 0, images: 0 }));

    try {
      let currentIndex = 0;
      let completedCount = 0;
      const concurrencyLimit = 3;

      const worker = async () => {
        while (currentIndex < wordsToProcess.length) {
          const wordIndex = currentIndex++;
          const word = wordsToProcess[wordIndex];

          try {
            const res = await fetch("/api/generate-media", {
              method: "POST",
              body: JSON.stringify({ 
                cards: [word], 
                targetLanguage: formData.targetLanguage, 
                topic: formData.topic 
              }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            finalCards.push(...data.cards);

            setGenerationStats(prev => ({
              ...prev,
              audio: prev.audio + (data.audioGenerated || 0),
              images: prev.images + (data.imagesGenerated || 0)
            }));

            const newHistoryEntries = data.cards.map(card => ({
              timestamp: new Date().toISOString(),
              query: formData.topic,
              subtopic: word.subtopic,
              word: card.target,
              targetLanguage: formData.targetLanguage
            }));
            
            try {
              await fetch("/api/history", {
                method: "POST",
                body: JSON.stringify(newHistoryEntries),
              });
              setHistory(prev => [...prev, ...newHistoryEntries]);
            } catch (e) {
              console.error("Failed to save history", e);
            }
          } catch (e) {
            console.error("Failed media for word:", word.target, e);
          } finally {
            completedCount++;
            setGeneratingProgress(prev => ({ ...prev, processedWords: completedCount }));
          }
        }
      };

      const workers = Array(Math.min(concurrencyLimit, wordsToProcess.length)).fill(null).map(() => worker());
      await Promise.all(workers);

      const compileRes = await fetch("/api/compile-apkg", {
        method: "POST",
        body: JSON.stringify({ topic: formData.topic, cards: finalCards }),
      });

      const blob = await compileRes.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setStep(5);
    } catch (err) {
      setError(err.message);
      setStep(3);
    }
  };

  return {
    loading,
    generationStats,
    generatingProgress,
    handleGenerateTopics,
    handleGenerateWords,
    handleGenerateMediaAndCompile
  };
}
