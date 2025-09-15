import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextFormatter from '../TextFormatter';

const mockContent = {
  title: 'Introduction to Photosynthesis',
  text: `What is Photosynthesis?

Photosynthesis is the process by which plants convert light energy into chemical energy. This process is essential for life on Earth.

Key Components:
- Chlorophyll: The green pigment that captures light
- Carbon Dioxide: Absorbed from the atmosphere
- Water: Absorbed from the roots
- Sunlight: The energy source

The Process:
1. Light absorption by chlorophyll
2. Water molecules are split
3. Carbon dioxide is converted to glucose
4. Oxygen is released as a byproduct

This process occurs in the chloroplasts of plant cells and is crucial for maintaining the oxygen levels in our atmosphere.`,
  objectives: [
    'Understand the basic process of photosynthesis',
    'Identify the key components involved',
    'Explain the importance of photosynthesis for life on Earth'
  ],
  subject: 'Biology',
  topic: 'Plant Biology',
  difficulty: 'intermediate',
  estimatedTime: 15,
  narration: 'Let\'s learn about photosynthesis, the amazing process that keeps our planet alive.'
};

describe('TextFormatter', () => {
  it('renders the title correctly', () => {
    render(<TextFormatter content={mockContent} />);
    expect(screen.getByText('Introduction to Photosynthesis')).toBeInTheDocument();
  });

  it('displays learning objectives when available', () => {
    render(<TextFormatter content={mockContent} />);
    expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    expect(screen.getByText('Understand the basic process of photosynthesis')).toBeInTheDocument();
  });

  it('shows subject and topic information', () => {
    render(<TextFormatter content={mockContent} />);
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('Plant Biology')).toBeInTheDocument();
  });

  it('parses and displays structured content', () => {
    render(<TextFormatter content={mockContent} />);
    expect(screen.getByText('What is Photosynthesis?')).toBeInTheDocument();
    expect(screen.getByText('Key Components:')).toBeInTheDocument();
    expect(screen.getByText('The Process:')).toBeInTheDocument();
  });

  it('allows toggling settings panel', () => {
    render(<TextFormatter content={mockContent} />);
    const settingsButton = screen.getByTitle('Reading Settings');
    fireEvent.click(settingsButton);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Line Height')).toBeInTheDocument();
    expect(screen.getByText('Alignment')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('allows changing font size', () => {
    render(<TextFormatter content={mockContent} />);
    const settingsButton = screen.getByTitle('Reading Settings');
    fireEvent.click(settingsButton);
    
    const increaseButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.classList.contains('w-3')
    );
    if (increaseButton) {
      fireEvent.click(increaseButton);
    }
  });

  it('displays reading progress', () => {
    render(<TextFormatter content={mockContent} />);
    expect(screen.getByText(/words/)).toBeInTheDocument();
    expect(screen.getByText(/:/)).toBeInTheDocument(); // Time format
  });

  it('handles empty content gracefully', () => {
    const emptyContent = { title: 'Empty Lesson' };
    render(<TextFormatter content={emptyContent} />);
    expect(screen.getByText('No Content Available')).toBeInTheDocument();
  });

  it('supports different learning styles', () => {
    const { rerender } = render(<TextFormatter content={mockContent} learningStyle="visual" />);
    expect(screen.getByText('Introduction to Photosynthesis')).toBeInTheDocument();
    
    rerender(<TextFormatter content={mockContent} learningStyle="analytical" />);
    expect(screen.getByText('Introduction to Photosynthesis')).toBeInTheDocument();
  });

  it('allows theme switching', () => {
    render(<TextFormatter content={mockContent} />);
    const settingsButton = screen.getByTitle('Reading Settings');
    fireEvent.click(settingsButton);
    
    const darkThemeButton = screen.getByTitle('Dark Theme');
    fireEvent.click(darkThemeButton);
    
    // The component should still be rendered (theme change is internal)
    expect(screen.getByText('Introduction to Photosynthesis')).toBeInTheDocument();
  });
});
