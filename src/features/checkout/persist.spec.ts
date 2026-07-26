import type { CheckoutState } from './checkoutSlice';
import { clearCheckoutState, loadCheckoutState, saveCheckoutState } from './persist';

const STORAGE_KEY = 'checkout-flow-web:checkout';

const sampleState: CheckoutState = {
  step: 'SUMMARY',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '123456789',
    phoneNumber: '+573001112233',
  },
  delivery: {
    recipientName: 'Jane Doe',
    recipientPhone: '+573001112233',
    address: 'Cra 7 # 45-12',
    city: 'Bogotá',
  },
  cardToken: 'tok_stagtest_1',
  installments: 1,
  transactionId: null,
  transactionStatus: null,
  submitStatus: 'idle',
  submitError: null,
};

describe('checkout persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns undefined when nothing is stored', () => {
    expect(loadCheckoutState()).toBeUndefined();
  });

  it('saves and reloads the checkout state', () => {
    saveCheckoutState(sampleState);

    expect(loadCheckoutState()).toEqual(sampleState);
  });

  it('clears the stored state', () => {
    saveCheckoutState(sampleState);

    clearCheckoutState();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns undefined instead of throwing when the stored value is corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');

    expect(loadCheckoutState()).toBeUndefined();
  });

  it('does not throw when localStorage.setItem fails', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => saveCheckoutState(sampleState)).not.toThrow();

    spy.mockRestore();
  });

  it('does not throw when localStorage.removeItem fails', () => {
    const spy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() => clearCheckoutState()).not.toThrow();

    spy.mockRestore();
  });
});
