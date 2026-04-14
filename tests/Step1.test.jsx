import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Step1 from '../src/components/generator/Step1';

describe('Step1 Component', () => {
  const defaultFormData = {
    topic: 'Testing Topic',
    nativeLanguage: 'English',
    targetLanguage: 'Spanish',
    subtopicCount: 5,
  };
  
  const mockSetFormData = vi.fn();
  const mockHandleGenerateTopics = vi.fn((e) => e.preventDefault());
  const mockT = (key) => key; // Passthrough mock for translations

  it('Should render the Topic generation form', () => {
    render(
      <Step1 
        formData={defaultFormData} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        loading={false} 
        t={mockT} 
      />
    );
    
    // Check main title
    expect(screen.getByText('hero_title')).toBeInTheDocument();
    
    // Check text input value
    const input = screen.getByDisplayValue('Testing Topic');
    expect(input).toBeInTheDocument();
  });

  it('Should call setFormData when input typing happens', () => {
    render(
      <Step1 
        formData={defaultFormData} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        loading={false} 
        t={mockT} 
      />
    );
    
    const input = screen.getByDisplayValue('Testing Topic');
    fireEvent.change(input, { target: { name: 'topic', value: 'New Topic' } });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });

  it('Should disable button when loading is true', () => {
    render(
      <Step1 
        formData={defaultFormData} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        loading={true} 
        t={mockT} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('btn_discovering')).toBeInTheDocument();
  });
});
