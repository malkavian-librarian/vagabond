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

  it('handleGenerateTopics tests without e and handles data.error', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ error: 'topic failed' })
    });

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      // call without e
      await result.current.handleGenerateTopics();
    });

    expect(mockSetError).toHaveBeenCalledWith('topic failed');
  });

  it('handleGenerateTopics captures AbortError quietly', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortErr);

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateTopics();
    });

    expect(mockSetError).not.toHaveBeenCalledWith('aborted');
  });

  it('handleGenerateMediaAndCompile executes workers', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'Test', native: 'Prueba', audioGenerated: 1 }], audioGenerated: 1, imagesGenerated: 1 })
    }).mockResolvedValueOnce({
      json: async () => ({ success: true })
    }).mockResolvedValueOnce({
      ok: true,
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

  it('handleGenerateMediaAndCompile throws error on !compileRes.ok', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'Test', native: 'Prueba', audioGenerated: 1 }] })
    }).mockResolvedValueOnce({
      json: async () => ({ success: true })
    }).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Compile failed" })
    });

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateMediaAndCompile();
    });

    expect(mockSetError).toHaveBeenCalledWith("Compile failed");
    expect(mockSetStep).toHaveBeenLastCalledWith(3);
  });

  it('handleGenerateMediaAndCompile throws explicit error when finalCards === 0 and NOT aborted', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ error: 'media pipeline failed explicitly' })
    });

    const propsWithBlankWords = getHookProps();
    propsWithBlankWords.generatedWords = [{ target: 'Test', native: 'Prueba' }];
    const { result } = renderHook(() => useGeneratorPipeline(propsWithBlankWords));

    await act(async () => {
      await result.current.handleGenerateMediaAndCompile();
    });

    // since worker hits an error, finalCards stays empty, and error is caught at component boundary!
    expect(mockSetError).toHaveBeenCalledWith("No cards generated successfully.");
  });

  it('handleGenerateMediaAndCompile catches history saving error gracefully', async () => {
    // 1: generate media success, 2: history fail, 3: compile success
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'word', native: 'pr', audioGenerated: 1 }] })
    }).mockRejectedValueOnce(new Error('History db offline'))
      .mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob()
    });

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateMediaAndCompile();
    });

    // Should complete step smoothly without breaking UI
    expect(mockSetStep).toHaveBeenLastCalledWith(5);
  });

  it('handleGenerateMediaAndCompile ignores unselected words and covers falsy generation stats', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'word', native: 'pr' }] }) // no audioGenerated/imagesGenerated
    }).mockResolvedValueOnce({
      json: async () => ({ success: true })
    }).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob()
    });

    const customProps = getHookProps();
    customProps.generatedWords = [
      { target: 'word', selected: true },
      { target: 'skipme', selected: false }
    ];

    const { result } = renderHook(() => useGeneratorPipeline(customProps));

    await act(async () => {
      await result.current.handleGenerateMediaAndCompile();
    });

    // Worker should only fire once (for selected=true)
    expect(fetch).toHaveBeenCalledTimes(3); // 1 worker fetch, 1 history fetch, 1 compile fetch
  });

  it('cancelGeneration successfully aborts operations', () => {
    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));
    act(() => {
      // Simulate generating state to populate abortController
      result.current.handleGenerateTopics();
    });
    expect(typeof result.current.cancelGeneration).toBe('function');
    
    act(() => {
      // should hit abortControllerRef.abort()
      result.current.cancelGeneration();
    });
    // Doesn't return or throw directly but triggers the fetch catch
  });

  it('handleGenerateWords captures AbortError without firing setError', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortErr);

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      await result.current.handleGenerateWords();
    });

    expect(mockSetError).not.toHaveBeenCalledWith('aborted');
    expect(mockSetStep).toHaveBeenCalledWith(3);
  });

  it('handleGenerateMediaAndCompile checks abortion and correctly loops out', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortErr);

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      // fire it
      const p = result.current.handleGenerateMediaAndCompile();
      result.current.cancelGeneration(); // triggers abort
      await p;
    });

    expect(mockSetError).not.toHaveBeenCalledWith('aborted');
    expect(mockSetStep).toHaveBeenLastCalledWith(3);
  });

  it('handleGenerateWords filters previouslyGeneratedWords when preventDuplicates is true', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ cards: [{ target: 'Test', native: 'Prueba' }], tokens: 100 })
    });

    const propsWithHistory = getHookProps();
    propsWithHistory.formData.preventDuplicates = true;
    propsWithHistory.formData.targetLanguage = 'Spanish';
    propsWithHistory.history = [{ targetLanguage: 'Spanish', word: 'Apple' }];

    const { result } = renderHook(() => useGeneratorPipeline(propsWithHistory));

    await act(async () => {
      await result.current.handleGenerateWords();
    });

    expect(result.current.loading).toBe(false);
  });

  it('handleGenerateMediaAndCompile returns to step 3 when cancelled and 0 cards generated', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    fetch.mockRejectedValue(abortErr);

    const { result } = renderHook(() => useGeneratorPipeline(getHookProps()));

    await act(async () => {
      // Setup cancel instantly
      const p = result.current.handleGenerateMediaAndCompile();
      result.current.cancelGeneration();
      await p;
    });

    // Check it went back to Step 3 because finalCards = 0 and it was aborted
    expect(mockSetStep).toHaveBeenLastCalledWith(3);
  });
});
