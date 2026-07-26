import type { CheckoutState } from './checkoutSlice';

const STORAGE_KEY = 'checkout-flow-web:checkout';

export function loadCheckoutState(): CheckoutState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutState) : undefined;
  } catch {
    return undefined;
  }
}

export function saveCheckoutState(state: CheckoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (quota exceeded, private browsing, etc.):
    // losing persistence isn't worse than a working in-memory session.
  }
}

export function clearCheckoutState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
