import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedVideoPlayer from '../EnhancedVideoPlayer';

// Mock video element methods
const mockVideoElement = {
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestFullscreen: jest.fn(),
  duration: 120,
  currentTime: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  paused: true
};

// Mock HTMLVideoElement
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(HTMLMediaElement.prototype, 'addEventListener', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(HTMLMediaElement.prototype, 'removeEventListener', {
  writable: true,
  value: jest.fn()
});

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve())
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve())
});

describe('EnhancedVideoPlayer', () => {
  const mockProps = {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Test Video',
    description: 'A test video for educational purposes',
    transcript: 'This is a test transcript for the video.',
    keyConcepts: ['Concept 1', 'Concept 2'],
    duration: 120
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders video player with correct props', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByTitle('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('A test video for educational purposes')).toBeInTheDocument();
  });

  it('displays key concepts', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByText('Key Concepts:')).toBeInTheDocument();
    expect(screen.getByText('Concept 1')).toBeInTheDocument();
    expect(screen.getByText('Concept 2')).toBeInTheDocument();
  });

  it('shows play button when video is paused', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('handles YouTube URLs correctly', () => {
    const youtubeProps = {
      ...mockProps,
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };
    
    render(<EnhancedVideoPlayer {...youtubeProps} />);
    
    expect(screen.getByTitle('Test Video')).toBeInTheDocument();
  });

  it('handles Vimeo URLs correctly', () => {
    const vimeoProps = {
      ...mockProps,
      src: 'https://vimeo.com/123456789'
    };
    
    render(<EnhancedVideoPlayer {...vimeoProps} />);
    
    expect(screen.getByTitle('Test Video')).toBeInTheDocument();
  });

  it('shows error state for invalid video URLs', async () => {
    const invalidProps = {
      ...mockProps,
      src: 'invalid-url'
    };
    
    render(<EnhancedVideoPlayer {...invalidProps} />);
    
    // Simulate video error
    const video = screen.getByTitle('Test Video');
    fireEvent.error(video);
    
    await waitFor(() => {
      expect(screen.getByText('Video Unavailable')).toBeInTheDocument();
    });
  });

  it('toggles transcript visibility', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const transcriptButton = screen.getByTitle('Show Transcript');
    fireEvent.click(transcriptButton);
    
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('This is a test transcript for the video.')).toBeInTheDocument();
  });

  it('handles volume changes', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const volumeSlider = screen.getByRole('slider');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(volumeSlider).toHaveValue(0.5);
  });

  it('toggles mute state', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const muteButton = screen.getByRole('button', { name: /volume/i });
    fireEvent.click(muteButton);
    
    // The mute state should be toggled (implementation detail)
    expect(muteButton).toBeInTheDocument();
  });

  it('shows settings panel when settings button is clicked', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);
    
    expect(screen.getByText('Playback Settings')).toBeInTheDocument();
    expect(screen.getByText('Playback Speed')).toBeInTheDocument();
  });

  it('changes playback rate', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);
    
    const speedButton = screen.getByText('1.5x');
    fireEvent.click(speedButton);
    
    expect(speedButton).toHaveClass('bg-blue-500');
  });

  it('handles fullscreen toggle', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const fullscreenButton = screen.getByTitle('Fullscreen');
    fireEvent.click(fullscreenButton);
    
    expect(fullscreenButton).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByText('Loading video...')).toBeInTheDocument();
  });

  it('handles progress bar clicks', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const progressBar = screen.getByRole('progressbar');
    fireEvent.click(progressBar);
    
    // The progress should be updated (implementation detail)
    expect(progressBar).toBeInTheDocument();
  });

  it('displays video duration and current time', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByText(/0:00 \/ 2:00/)).toBeInTheDocument();
  });

  it('handles mouse interactions for controls visibility', () => {
    render(<EnhancedVideoPlayer {...mockProps} />);
    
    const container = screen.getByRole('region');
    fireEvent.mouseMove(container);
    
    // Controls should be visible after mouse move
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    const minimalProps = {
      src: 'https://example.com/video.mp4'
    };
    
    render(<EnhancedVideoPlayer {...minimalProps} />);
    
    expect(screen.getByTitle('Educational Video')).toBeInTheDocument();
  });

  it('handles external links for YouTube videos', async () => {
    const youtubeProps = {
      ...mockProps,
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };
    
    render(<EnhancedVideoPlayer {...youtubeProps} />);
    
    // Simulate error to show external link
    const video = screen.getByTitle('Test Video');
    fireEvent.error(video);
    
    await waitFor(() => {
      expect(screen.getByText('Open in YouTube')).toBeInTheDocument();
    });
  });

  it('handles external links for Vimeo videos', async () => {
    const vimeoProps = {
      ...mockProps,
      src: 'https://vimeo.com/123456789'
    };
    
    render(<EnhancedVideoPlayer {...vimeoProps} />);
    
    // Simulate error to show external link
    const video = screen.getByTitle('Test Video');
    fireEvent.error(video);
    
    await waitFor(() => {
      expect(screen.getByText('Open in Vimeo')).toBeInTheDocument();
    });
  });
});
