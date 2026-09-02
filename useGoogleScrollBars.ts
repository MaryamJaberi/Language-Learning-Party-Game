import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGoogleScrollBarsOptions {
  threshold?: number;
  initialVisible?: boolean;
}

/**
 * Hook for Google-like smart dynamic header & footer visibility on scroll.
 * - Scrolling DOWN hides the top header and bottom footer (expands viewport).
 * - Scrolling UP or being near top reveals the header and footer smoothly.
 */
export function useGoogleScrollBars(options: UseGoogleScrollBarsOptions = {}) {
  const { threshold = 10, initialVisible = true } = options;
  const [isBarsVisible, setIsBarsVisible] = useState(initialVisible);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInteracting = useRef(false);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollY = container.scrollTop;
    const deltaY = currentScrollY - lastScrollY.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    // Always show when at the very top or bottom of the container
    if (currentScrollY <= 20 || currentScrollY >= maxScroll - 10) {
      setIsBarsVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Scrolling DOWN -> Hide bars like Google Apps
        setIsBarsVisible(false);
      } else {
        // Scrolling UP -> Reveal bars smoothly
        setIsBarsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  }, [threshold]);

  const showBars = useCallback(() => {
    setIsBarsVisible(true);
  }, []);

  const hideBars = useCallback(() => {
    setIsBarsVisible(false);
  }, []);

  const toggleBars = useCallback(() => {
    setIsBarsVisible(prev => !prev);
  }, []);

  return {
    isBarsVisible,
    scrollContainerRef,
    handleScroll,
    showBars,
    hideBars,
    toggleBars
  };
}
