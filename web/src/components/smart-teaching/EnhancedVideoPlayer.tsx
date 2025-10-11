"use client";
import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Captions, 
  AlertCircle, Loader2, ExternalLink
} from 'lucide-react';

interface EnhancedVideoPlayerProps {
  src: string;
  title?: string;
  description?: string;
  captions?: string;
  poster?: string;
  transcript?: string;
  keyConcepts?: string[];
  duration?: number;
  subject?: string;
  topic?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  showControls: boolean;
  showSettings: boolean;
  showTranscript: boolean;
  iframeFailed: boolean;
  showPlayer: boolean;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  title,
  description,
  //captions,
  poster,
  transcript,
  keyConcepts = [],
  //duration,
  subject,
  topic,
  onProgress,
  onComplete,
  onError,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false,
    isLoading: true,
    hasError: false,
    errorMessage: '',
    showControls: true,
    showSettings: false,
    showTranscript: false,
    iframeFailed: false,
    showPlayer: false
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle video loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, hasError: false }));
      
      // Set a timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          hasError: true,
          errorMessage: 'Video is taking too long to load. Please try again or check your connection.'
        }));
        if (onError) {
          onError('Video loading timeout');
        }
      }, 10000); // 10 second timeout
    };

    const handleLoadedData = () => {
      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        duration: video.duration || 0,
        hasError: false 
      }));
    };

    const handleError = () => {
      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        hasError: true,
        errorMessage: 'Failed to load video. Please check the URL or try again.'
      }));
      if (onError) {
        onError('Video loading failed');
      }
    };

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setState(prev => ({ ...prev, currentTime: video.currentTime }));
      if (onProgress) {
        onProgress(progress);
      }
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      if (onComplete) {
        onComplete();
      }
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume,
        isMuted: video.muted 
      }));
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      // Clear timeout on cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [src, onProgress, onComplete, onError]);

  // Auto-hide controls
  useEffect(() => {
    if (!state.isPlaying) return;

    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, showControls: false }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [state.isPlaying, state.showControls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setState(prev => ({ ...prev, isPlaying: true, showControls: true }));
    } else {
      video.pause();
      setState(prev => ({ ...prev, isPlaying: false, showControls: true }));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * video.duration;
    
    video.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setState(prev => ({ ...prev, isMuted: video.muted }));
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setState(prev => ({ ...prev, showControls: true }));
  };

  const handleMouseLeave = () => {
    if (state.isPlaying) {
      setTimeout(() => {
        setState(prev => ({ ...prev, showControls: false }));
      }, 2000);
    }
  };

  // Check if it's a YouTube URL
  const isYouTubeUrl = (url: string) => {
    console.log('=====> isYouTubeUrl:', url);
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Check if it's a Vimeo URL
  const isVimeoUrl = (url: string) => {
    return url.includes('vimeo.com');
  };

  // Validate and get working video URL
  const getWorkingVideoUrl = (originalUrl: string): string => {
    console.log('🔍 [DEBUG] Validating video URL:', originalUrl);
    
    // If it's already a valid YouTube or Vimeo URL, use it as-is
    if (isYouTubeUrl(originalUrl) || isVimeoUrl(originalUrl)) {
      console.log('✅ [DEBUG] Valid video URL detected:', originalUrl);
      return originalUrl;
    }
  
    // If it's a direct video URL, use it
    if (originalUrl.startsWith('http') && (originalUrl.includes('.mp4') || originalUrl.includes('.webm') || originalUrl.includes('.mov'))) {
      console.log('✅ [DEBUG] Valid direct video URL detected:', originalUrl);
      return originalUrl;
    }
  
    // Better fallback - use a known working educational video
    console.warn('❌ [DEBUG] Invalid video URL, using educational fallback:', originalUrl);
    // Use a reliable educational video that won't redirect
    return 'https://www.youtube.com/watch?v=WUvTyaaNkzM'; // Khan Academy - Introduction to Algebra
  };

  // Get the working video URL
  const workingVideoUrl = getWorkingVideoUrl(src);
  
  // Debug logging
  console.log('EnhancedVideoPlayer Debug:', {
    originalSrc: src,
    workingVideoUrl,
    subject,
    topic,
    isYouTube: isYouTubeUrl(workingVideoUrl),
    isVimeo: isVimeoUrl(workingVideoUrl)
  });

  // Convert YouTube URL to embed format with better parameters
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    
    if (!videoId) {
      console.error('Could not extract video ID from URL:', url);
      return null;
    }
    
    // Remove the deprecated showinfo parameter
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&autoplay=0`;
  };

  // Convert Vimeo URL to embed format
  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  };

  if (state.hasError) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
          <p className="text-gray-300 mb-4">{state.errorMessage}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Video URL: {workingVideoUrl}</p>
            {isYouTubeUrl(workingVideoUrl) && (
              <a 
                href={workingVideoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in YouTube</span>
              </a>
            )}
            {isVimeoUrl(workingVideoUrl) && (
              <a 
                href={workingVideoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Vimeo</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render embedded video for YouTube/Vimeo
  if (isYouTubeUrl(workingVideoUrl) || isVimeoUrl(workingVideoUrl)) {
  const embedUrl = isYouTubeUrl(workingVideoUrl) ? getYouTubeEmbedUrl(workingVideoUrl) : getVimeoEmbedUrl(workingVideoUrl);
  
  if (!embedUrl) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Invalid Video URL</h3>
          <p className="text-gray-300 mb-4">Could not process: {workingVideoUrl}</p>
          <a 
            href={workingVideoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`w-full aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        title={title || 'Educational Video'}
        className="w-full h-full"
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {title && (
        <div className="p-4 bg-white">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        preload="metadata"
        onClick={togglePlay}
      >
        <source src={workingVideoUrl} type="video/mp4" />
        <source src={workingVideoUrl} type="video/webm" />
        {/* Note: Captions removed to avoid CORS issues with external URLs */}
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!state.isPlaying && !state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <Play className="w-8 h-8 text-gray-800 ml-1" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {state.showControls && !state.isLoading && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4">
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            className="w-full h-1 bg-white bg-opacity-30 rounded-full mb-3 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {state.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-blue-500"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {transcript && (
                <button
                  onClick={() => setState(prev => ({ ...prev, showTranscript: !prev.showTranscript }))}
                  className={`p-2 rounded transition-colors ${
                    state.showTranscript ? 'bg-blue-500 text-white' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                  title="Show Transcript"
                >
                  <Captions className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                className="text-white hover:text-blue-400 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
                title="Fullscreen"
              >
                {state.isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {state.showSettings && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg min-w-48">
          <h4 className="font-semibold mb-3">Playback Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300">Playback Speed</label>
              <div className="flex space-x-2 mt-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-1 text-xs rounded ${
                      state.playbackRate === rate ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Panel */}
      {state.showTranscript && transcript && (
        <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Transcript</h4>
            <button
              onClick={() => setState(prev => ({ ...prev, showTranscript: false }))}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="text-sm leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Video Info */}
      {title && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded-lg max-w-md">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-gray-300 mt-1">{description}</p>
          )}
          {keyConcepts.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Key Concepts:</p>
              <div className="flex flex-wrap gap-1">
                {keyConcepts.map((concept, index) => (
                  <span key={index} className="text-xs bg-blue-500 px-2 py-1 rounded">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;
