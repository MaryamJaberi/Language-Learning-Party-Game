import { useState, useRef, useCallback } from 'react';

interface UseGoogleScrollBarsOptions {
  threshold?: number;
  initialVisible?: boolean;
  mode?: 'dual-google' | 'synchronized';
}

/**
 * Hook for Google-like smart dynamic header & footer visibility on scroll.
 * - In dual-google mode:
 *   - Scrolling DOWN ("میری پایین") reveals TOP header ("بالایی پدیدار شه") and hides bottom.
 *   - Scrolling UP ("میری بالا") reveals BOTTOM bar ("پایینی پدیدار شه") and hides top.
 *   - Near top or bottom, appropriate navigation is always shown.
 */
export function useGoogleScrollBars(options: UseGoogleScrollBarsOptions = {}) {
  const { threshold = 8, initialVisible = true, mode = 'dual-google' } = options;
  const [isBarsVisible, setIsBarsVisible] = useState(initialVisible);
  const [isTopVisible, setIsTopVisible] = useState(initialVisible);
  const [isBottomVisible, setIsBottomVisible] = useState(initialVisible);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollY = container.scrollTop;
    const deltaY = currentScrollY - lastScrollY.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    // Always show both when at the very top of the container
    if (currentScrollY <= 20) {
      setIsTopVisible(true);
      setIsBottomVisible(true);
      setIsBarsVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    // When reaching the bottom of the container, ensure bottom bar is visible
    if (maxScroll > 0 && currentScrollY >= maxScroll - 20) {
      setIsBottomVisible(true);
      if (mode === 'dual-google') {
        setIsTopVisible(false);
      } else {
        setIsBarsVisible(true);
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    if (Math.abs(deltaY) > threshold) {
      if (mode === 'dual-google') {
        if (deltaY > 0) {
          // Scrolling DOWN (going down): Top header appears ("میری پایین بالایی پدیدار شه")
          setIsTopVisible(true);
          setIsBottomVisible(false);
          setIsBarsVisible(true);
        } else {
          // Scrolling UP (going up): Bottom bar appears ("میری بالا پایینی پدیدار شه")
          setIsBottomVisible(true);
          setIsTopVisible(false);
          setIsBarsVisible(true);
        }
      } else {
        if (deltaY > 0) {
          setIsBarsVisible(false);
          setIsTopVisible(false);
          setIsBottomVisible(false);
        } else {
          setIsBarsVisible(true);
          setIsTopVisible(true);
          setIsBottomVisible(true);
        }
      }
      lastScrollY.current = currentScrollY;
    }
  }, [threshold, mode]);

  const showBars = useCallback(() => {
    setIsBarsVisible(true);
    setIsTopVisible(true);
    setIsBottomVisible(true);
  }, []);

  const hideBars = useCallback(() => {
    setIsBarsVisible(false);
    setIsTopVisible(false);
    setIsBottomVisible(false);
  }, []);

  const toggleBars = useCallback(() => {
    setIsBarsVisible(prev => {
      const next = !prev;
      setIsTopVisible(next);
      setIsBottomVisible(next);
      return next;
    });
  }, []);

  return {
    isBarsVisible,
    isTopVisible,
    isBottomVisible,
    scrollContainerRef,
    handleScroll,
    showBars,
    hideBars,
    toggleBars
  };
}

