import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Step2 from '../src/components/generator/Step2.jsx';
import Step4Media from '../src/components/generator/Step4Media.jsx';
import Step5Download from '../src/components/generator/Step5Download.jsx';

describe('Generator Suite End-to-End Visual Loading', () => {
  const mockT = (key) => key;

  it('Renders and interacts with Step2 configuration constraints', () => {
    const mockHandleGenerate = vi.fn((e) => e.preventDefault());
    const mockSetFormData = vi.fn();
    const mockToggleSubtopic = vi.fn();
    const mockSetAvailableSubtopics = vi.fn();
    
    render(
      <Step2 
        formData={{ wordsPerSubtopic: 10, topic: 'Science' }} 
        availableSubtopics={['Physics', 'Chemistry']} 
        selectedSubtopics={['Physics']} 
        toggleSubtopic={mockToggleSubtopic} 
        handleGenerateWords={mockHandleGenerate} 
        setFormData={mockSetFormData} 
        setAvailableSubtopics={mockSetAvailableSubtopics} 
        loading={false} 
        generationStats={{}} 
        t={mockT} 
      />
    );
    expect(screen.getByText('step2_title')).toBeInTheDocument();
    
    // Simulate checking a subtopic
    const physicsLabel = screen.getByText('Physics');
    fireEvent.click(physicsLabel);
    expect(mockToggleSubtopic).toHaveBeenCalledWith('Physics');

    // Simulate input typing
    const formInput = screen.getByPlaceholderText('placeholder_custom_subtopic');
    fireEvent.change(formInput, { target: { value: 'Biology' } });
    
    // Simulate Form Submission
    const submitBtn = screen.getByRole('button', { name: 'btn_generate_words' });
    fireEvent.click(submitBtn);
    expect(mockHandleGenerate).toHaveBeenCalled();
  });

  it('Renders Step4Media loading stats correctly', () => {
    const progress = { processedWords: 3, totalWords: 10 };
    render(
      <Step4Media 
        generatingProgress={progress} 
        setStep={vi.fn()} 
        setGeneratingProgress={vi.fn()} 
        t={mockT} 
        nativeLanguage="English" 
      />
    );
    expect(screen.getByText('3 / 10 Words Processed')).toBeInTheDocument();
  });

  it('Renders Step5Download statistics', () => {
    render(
      <Step5Download 
        generationStats={{ cards: 15, audio: 15, images: 5, tokens: 4000 }} 
        downloadUrl="blob:xyz" 
        formData={{ topic: 'Science' }} 
        setStep={vi.fn()} 
        setDownloadUrl={vi.fn()} 
        t={mockT} 
      />
    );
    expect(screen.getAllByText('15')[0]).toBeInTheDocument();
    expect(screen.getByText('4000')).toBeInTheDocument();
  });
});
