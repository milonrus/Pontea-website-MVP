'use client';

import React, { useRef, useEffect } from 'react';

interface PlatformVideoProps {
  src: string;
  isActive: boolean;
  className?: string;
  resetKey?: number;
  onEnded?: () => void;
}

const PlatformVideo: React.FC<PlatformVideoProps> = ({ src, isActive, className = '', resetKey, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset video to 0:00 and play when resetKey changes
  useEffect(() => {
    if (resetKey === undefined) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (isActive) {
      video.play().catch(() => {});
    }
  }, [resetKey]);

  // Intersection Observer: play when visible, pause when off-screen
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isActive) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isActive]);

  // Play/pause based on isActive prop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload={isActive ? 'auto' : 'none'}
        className="w-full h-full object-contain"
        src={`${src}.webm`}
        onEnded={onEnded}
      />
    </div>
  );
};

export default PlatformVideo;
