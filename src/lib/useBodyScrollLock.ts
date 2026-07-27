import { useEffect } from 'react';

/**
 * Locks body scroll while `active` is true. A fixed-position modal on its
 * own doesn't stop the page behind it from scrolling, which shows up as a
 * second, distracting scrollbar for the hidden content underneath.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
