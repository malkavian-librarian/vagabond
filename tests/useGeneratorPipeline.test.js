"use client";
import { renderHook, act } from '@testing-library/react';
import { useGeneratorPipeline } from '../src/hooks/useGeneratorPipeline';
import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('useGeneratorPipeline Hook', () => {
  const mockSetGeneratedWords = vi.fn();
  const mockSetAvailableSubtopics = vi.fn();
  const mockSetSelectedSubtopics = vi.fn();
  const mockSetStep = vi.fn();
  const mockSetError = vi.fn();
  const mockSetHistory = vi.fn();
  const mockSetDownloadUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getHookProps = () => ({
    formData: { topic: 'React', subtopicCount: 2, wordsPerSubtopic: 5 },
    activeModel: 'mock-model',
    generatedWords: [{ target: 'word', selected: true }],
    setGeneratedWords: mockSetGeneratedWords,
    selectedSubtopics: ['A'],
    setAvailableSubtopics: mockSetAvailableSubtopics,
    setSelectedSubtopics: mockSetSelectedSubtopics,
    history: [],
    setHistory: mockSetHistory,
    setDownloadUrl: mockSetDownloadUrl,
    setStep: mockSetStep,
    setError: mockSetError
  });

  it('handleGenerateTopics successfully resolves and maps step 2', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ subtopics: ['SubA', 'SubB'] })
    });

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateTopics({ preventDefault: () => {} });
    });

    expect(mockSetError).toHaveBeenCalledWith("");
    expect(mockSetAvailableSubtopics).toHaveBeenCalledWith(['SubA', 'SubB']);
    expect(mockSetStep).toHaveBeenCalledWith(2);
  });

  it('handleGenerateWords creates words and moves to step 3', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'Test', native: 'Prueba' }], tokens: 100 })
    });

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateWords();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.generationStats.cards).toBe(1);
    expect(mockSetStep).toHaveBeenCalledWith(3);
  });

  it('handleGenerateMediaAndCompile executes workers', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'Test', native: 'Prueba', audioGenerated: 1 }], audioGenerated: 1, imagesGenerated: 1 })
    }).mockResolvedValueOnce({
      json: async () => ({ success: true })
    }).mockResolvedValueOnce({
      blob: async () => new Blob()
    });

    global.URL.createObjectURL = vi.fn(() => 'blob:url');

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateMediaAndCompile();
    });

    expect(mockSetStep).toHaveBeenCalledWith(4);
    expect(mockSetStep).toHaveBeenLastCalledWith(5);
    expect(mockSetDownloadUrl).toHaveBeenCalled();
  });
});
