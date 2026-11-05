/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * CuteTopProgressBar
 * 
 * Elegant golden shimmer progress bar that glides across the very top of
 * the window whenever navigating between menu routes in the Admin Portal.
 */
export default function CuteTopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    // Start progress on location change
    clearAllTimers();
    setVisible(true);
    setProgress(25);

    const t1 = setTimeout(() => {
      setProgress(65);
    }, 100);

    const t2 = setTimeout(() => {
      setProgress(90);
    }, 220);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 380);

    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 600);

    timersRef.current = [t1, t2, t3, t4];

    return () => {
      clearAllTimers();
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999999] pointer-events-none h-[2.5px] overflow-visible"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#8b6f4e] via-[#d4af37] to-[#f5d77f] transition-all duration-200 ease-out relative shadow-[0_0_10px_rgba(212,175,55,0.85)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: progress === 0 ? 'none' : 'width 220ms ease-out, opacity 250ms ease-in',
        }}
      >
        {/* Cute leading sparkle star on the head of the progress bar */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#d4af37] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

