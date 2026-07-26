import { store } from './store';

describe('store', () => {
  it('creates a store with a working dispatch and getState', () => {
    expect(typeof store.dispatch).toBe('function');
    expect(store.getState()).toEqual({
      product: { data: null, status: 'idle', error: null },
      checkout: {
        step: 'PRODUCT',
        customer: null,
        delivery: null,
        cardToken: null,
        installments: 1,
        transactionId: null,
        transactionStatus: null,
        submitStatus: 'idle',
        submitError: null,
      },
    });
  });

  it('persists checkout state to localStorage on every dispatch', () => {
    localStorage.clear();

    store.dispatch({ type: 'checkout/openCheckoutModal' });

    const raw = localStorage.getItem('checkout-flow-web:checkout');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).step).toBe('CHECKOUT_MODAL');
  });
});
