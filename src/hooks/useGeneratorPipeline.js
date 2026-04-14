"use client";
import { useState, useRef } from "react";

export function useGeneratorPipeline({ formData, activeModel, generatedWords, setGeneratedWords, selectedSubtopics, setAvailableSubtopics, setSelectedSubtopics, history, setHistory, setDownloadUrl, setStep, setError }) {
  const [loading, setLoading] = useState(false);
  const [generationStats, setGenerationStats] = useState({ cards: 0, audio: 0, images: 0, tokens: 0 });
  const [generatingProgress, setGeneratingProgress] = useState({ totalWords: 0, processedWords: 0 });
  const abortControllerRef = useRef(null);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerateTopics = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({ ...formData, model: activeModel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAvailableSubtopics(data.subtopics);
      setSelectedSubtopics(data.subtopics.slice(0, Number(formData.subtopicCount) || 5));
      setStep(2);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
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

    abortControllerRef.current = new AbortController();
    try {
      for (const subtopic of selectedSubtopics) {
        if (abortControllerRef.current?.signal.aborted) break;

        const res = await fetch("/api/generate-words", {
          method: "POST",
          signal: abortControllerRef.current.signal,
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
      if (err.name !== 'AbortError') setError(err.message);
      else {
        setGeneratedWords(allWords);
        setStep(3);
      }
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

    abortControllerRef.current = new AbortController();
    try {
      let currentIndex = 0;
      let completedCount = 0;
      const concurrencyLimit = 2;

      const worker = async () => {
        while (currentIndex < wordsToProcess.length) {
          if (abortControllerRef.current?.signal.aborted) break;

          const wordIndex = currentIndex++;
          const word = wordsToProcess[wordIndex];

          try {
            const res = await fetch("/api/generate-media", {
              method: "POST",
              signal: abortControllerRef.current.signal,
              body: JSON.stringify({ 
                cards: [word], 
                targetLanguage: formData.targetLanguage, 
                topic: formData.topic,
                model: activeModel
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
            if (e.name !== 'AbortError') console.error("Failed media for word:", word.target, e);
          } finally {
            completedCount++;
            setGeneratingProgress(prev => ({ ...prev, processedWords: completedCount }));
          }
        }
      };

      const workers = Array(Math.min(concurrencyLimit, wordsToProcess.length)).fill(null).map(() => worker());
      await Promise.all(workers);

      // Even if aborted, we check if we have any valid cards to compile
      if (finalCards.length === 0) {
        if (abortControllerRef.current?.signal.aborted) {
          setStep(3);
          return;
        }
        throw new Error("No cards generated successfully.");
      }

      const compileRes = await fetch("/api/compile-apkg", {
        method: "POST",
        body: JSON.stringify({ topic: formData.topic, cards: finalCards }),
      });

      if (!compileRes.ok) {
        const errorData = await compileRes.json();
        throw new Error(errorData.error || "Failed to compile APKG");
      }

      const blob = await compileRes.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setStep(5);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
      setStep(3);
    }
  };

  return {
    loading,
    generationStats,
    generatingProgress,
    setGeneratingProgress,
    cancelGeneration,
    handleGenerateTopics,
    handleGenerateWords,
    handleGenerateMediaAndCompile
  };
}
