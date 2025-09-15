import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveGraph from '../InteractiveGraph';

describe('InteractiveGraph', () => {
  it('renders with valid points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 }
    ];
    
    render(<InteractiveGraph points={points} title="Test Graph" />);
    
    expect(screen.getByText('Test Graph')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // SVG element
  });

  it('renders with valid mathematical expression', () => {
    render(<InteractiveGraph expression="x * x" title="Quadratic Function" />);
    
    expect(screen.getByText('Quadratic Function')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('handles invalid mathematical expressions gracefully', () => {
    render(<InteractiveGraph expression="x = 5" title="Invalid Expression" />);
    
    expect(screen.getByText('Invalid Expression')).toBeInTheDocument();
    expect(screen.getByText('Unable to generate graph')).toBeInTheDocument();
    expect(screen.getByText('Invalid mathematical expression')).toBeInTheDocument();
  });

  it('handles empty expressions gracefully', () => {
    render(<InteractiveGraph expression="" title="Empty Expression" />);
    
    expect(screen.getByText('Empty Expression')).toBeInTheDocument();
    expect(screen.getByText('Unable to generate graph')).toBeInTheDocument();
    expect(screen.getByText('No data points provided')).toBeInTheDocument();
  });

  it('handles expressions with dangerous characters', () => {
    render(<InteractiveGraph expression="x; alert('hack')" title="Dangerous Expression" />);
    
    expect(screen.getByText('Dangerous Expression')).toBeInTheDocument();
    expect(screen.getByText('Unable to generate graph')).toBeInTheDocument();
  });

  it('handles expressions with assignment operators', () => {
    render(<InteractiveGraph expression="let x = 5" title="Assignment Expression" />);
    
    expect(screen.getByText('Assignment Expression')).toBeInTheDocument();
    expect(screen.getByText('Unable to generate graph')).toBeInTheDocument();
  });

  it('handles expressions with Math functions', () => {
    render(<InteractiveGraph expression="Math.sin(x)" title="Sine Function" />);
    
    expect(screen.getByText('Sine Function')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('handles expressions with exponentiation', () => {
    render(<InteractiveGraph expression="x^2" title="Power Function" />);
    
    expect(screen.getByText('Power Function')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('handles expressions with complex mathematical operations', () => {
    render(<InteractiveGraph expression="Math.sqrt(x*x + 1)" title="Complex Function" />);
    
    expect(screen.getByText('Complex Function')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders without title', () => {
    const points = [{ x: 0, y: 0 }];
    render(<InteractiveGraph points={points} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.queryByText('Test Graph')).not.toBeInTheDocument();
  });

  it('handles custom xRange', () => {
    render(<InteractiveGraph expression="x" xRange={[-5, 5]} title="Custom Range" />);
    
    expect(screen.getByText('Custom Range')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('handles custom samples', () => {
    render(<InteractiveGraph expression="x" samples={50} title="Custom Samples" />);
    
    expect(screen.getByText('Custom Samples')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('prioritizes points over expression', () => {
    const points = [{ x: 0, y: 0 }];
    render(<InteractiveGraph points={points} expression="x * x" title="Priority Test" />);
    
    expect(screen.getByText('Priority Test')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
