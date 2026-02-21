'use client';

import React, { useRef, useEffect, useState } from 'react';

interface PlatformVideoProps {
  src: string;
  isActive: boolean;
  shouldLoad?: boolean;
  placeholderLabel?: string;
  className?: string;
  resetKey?: number;
  onEnded?: () => void;
}

const PlatformVideo: React.FC<PlatformVideoProps> = ({
  src,
  isActive,
  shouldLoad = false,
  placeholderLabel = 'Platform preview',
  className = '',
  resetKey,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const canLoadVideo = shouldLoad;
  const shouldPlay = canLoadVideo && isVisible && isActive;

  useEffect(() => {
    if (!canLoadVideo) {
      setHasLoadedData(false);
    }
  }, [canLoadVideo, src]);

  // Reset video to 0:00 and play when resetKey changes
  useEffect(() => {
    if (!shouldPlay) return;
    if (resetKey === undefined) return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.play().catch(() => {});
  }, [resetKey, shouldPlay]);

  // Intersection Observer: mark visibility and play only when active + visible.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Play/pause based on active state, load state, and viewport visibility.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canLoadVideo) return;

    if (shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [canLoadVideo, shouldPlay]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {canLoadVideo ? (
        <video
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
          src={`${src}.webm`}
          onEnded={onEnded}
          onLoadedData={() => setHasLoadedData(true)}
        />
      ) : null}

      {(!canLoadVideo || !hasLoadedData) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-500">
          <div className="mb-2 text-sm font-semibold text-primary/80">{placeholderLabel}</div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Preview loading</div>
        </div>
      )}
    </div>
  );
};

export default PlatformVideo;
