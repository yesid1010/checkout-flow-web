import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does nothing while inactive', () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.overflow).toBe('');
  });

  it('locks body scroll while active and restores it on unmount', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('restores the previous overflow value instead of always clearing it', () => {
    document.body.style.overflow = 'scroll';

    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('scroll');
  });

  it('unlocks when active flips back to false without unmounting', () => {
    const { rerender } = renderHook(({ active }) => useBodyScrollLock(active), {
      initialProps: { active: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    rerender({ active: false });

    expect(document.body.style.overflow).toBe('');
  });
});
