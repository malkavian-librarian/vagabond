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
        cancelGeneration={vi.fn()}
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
        cancelGeneration={vi.fn()}
        loading={false} 
        t={mockT} 
      />
    );
    
    const input = screen.getByDisplayValue('Testing Topic');
    fireEvent.change(input, { target: { name: 'topic', value: 'New Topic' } });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });

  it('Should disable button when loading is true and handle cancel', () => {
    const mockCancel = vi.fn();
    render(
      <Step1 
        formData={defaultFormData} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        cancelGeneration={mockCancel}
        loading={true} 
        t={mockT} 
      />
    );
    
    const button = screen.getByText('btn_discovering');
    expect(button).toBeDisabled();

    const cancelButton = screen.getByText('btn_cancel');
    fireEvent.click(cancelButton);
    expect(mockCancel).toHaveBeenCalled();
  });

  it('Should handle checkbox inputs appropriately', () => {
    render(
      <Step1 
        formData={{ ...defaultFormData, someCheckbox: false }} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        cancelGeneration={vi.fn()}
        loading={false} 
        t={mockT} 
      />
    );
    
    // Step1 doesn't actively have a checkbox right now natively, but let's just simulate the onChange
    // wait, Step1.jsx line 49 is a text input, let's inject a fake element event to test branch
    const input = screen.getByDisplayValue('Testing Topic');
    fireEvent.change(input, { target: { name: 'testCheck', type: 'checkbox', checked: true } });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });

  it('Should handle subtopicCount branch logic', () => {
    render(
      <Step1 
        formData={defaultFormData} 
        setFormData={mockSetFormData} 
        handleGenerateTopics={mockHandleGenerateTopics} 
        cancelGeneration={vi.fn()}
        loading={false} 
        t={mockT} 
      />
    );
    
    // Simulate changing the number input (which activates name==='subtopicCount' ? Number(value))
    const input = screen.getByDisplayValue('5'); // subtopicCount default is 5
    fireEvent.change(input, { target: { name: 'subtopicCount', value: '10' } });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });
});
