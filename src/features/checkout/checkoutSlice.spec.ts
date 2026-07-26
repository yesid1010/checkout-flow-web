import { configureStore } from '@reduxjs/toolkit';
import * as api from '../../services/api';
import productReducer from '../product/productSlice';
import checkoutReducer, {
  closeCheckoutModal,
  openCheckoutModal,
  refreshTransactionStatus,
  resetCheckout,
  sanitizeRehydratedState,
  submitCheckoutForm,
  submitTransaction,
  type CheckoutState,
} from './checkoutSlice';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  createTransaction: jest.fn(),
  getTransaction: jest.fn(),
}));

const initialState: CheckoutState = {
  step: 'PRODUCT',
  customer: null,
  delivery: null,
  cardToken: null,
  installments: 1,
  transactionId: null,
  transactionStatus: null,
  submitStatus: 'idle',
  submitError: null,
};

const customer = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC' as const,
  documentNumber: '123456789',
  phoneNumber: '+573001112233',
};

const delivery = {
  recipientName: 'Jane Doe',
  recipientPhone: '+573001112233',
  address: 'Cra 7 # 45-12',
  city: 'Bogotá',
};

const product = {
  id: 'prod-1',
  name: 'Wireless Headphones',
  description: 'Noise-cancelling',
  priceInCents: 25000_00,
  stock: 5,
};

const buildStore = () =>
  configureStore({ reducer: { product: productReducer, checkout: checkoutReducer } });

beforeEach(() => {
  localStorage.clear();
});

describe('checkoutSlice reducers', () => {
  it('returns the initial state (PRODUCT step)', () => {
    expect(checkoutReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('openCheckoutModal moves to CHECKOUT_MODAL', () => {
    const state = checkoutReducer(initialState, openCheckoutModal());
    expect(state.step).toBe('CHECKOUT_MODAL');
  });

  it('closeCheckoutModal moves back to PRODUCT', () => {
    const modalState = { ...initialState, step: 'CHECKOUT_MODAL' as const };
    const state = checkoutReducer(modalState, closeCheckoutModal());
    expect(state.step).toBe('PRODUCT');
  });

  it('submitCheckoutForm stores customer/delivery/card and moves to SUMMARY', () => {
    const state = checkoutReducer(
      initialState,
      submitCheckoutForm({ customer, delivery, cardToken: 'tok_stagtest_1', installments: 2 }),
    );

    expect(state.step).toBe('SUMMARY');
    expect(state.customer).toEqual(customer);
    expect(state.delivery).toEqual(delivery);
    expect(state.cardToken).toBe('tok_stagtest_1');
    expect(state.installments).toBe(2);
  });

  it('resetCheckout clears the persisted state and returns the defaults', () => {
    localStorage.setItem('checkout-flow-web:checkout', JSON.stringify({ step: 'STATUS' }));

    const state = checkoutReducer({ ...initialState, step: 'STATUS' }, resetCheckout());

    expect(state).toEqual(initialState);
    expect(localStorage.getItem('checkout-flow-web:checkout')).toBeNull();
  });
});

describe('sanitizeRehydratedState', () => {
  it('resets a stuck "submitting" status to idle and clears the error', () => {
    const stuck: CheckoutState = { ...initialState, submitStatus: 'submitting', submitError: 'x' };

    expect(sanitizeRehydratedState(stuck)).toEqual({
      ...initialState,
      submitStatus: 'idle',
      submitError: null,
    });
  });

  it('leaves any other state untouched', () => {
    const failed: CheckoutState = { ...initialState, submitStatus: 'failed', submitError: 'boom' };

    expect(sanitizeRehydratedState(failed)).toEqual(failed);
  });
});

describe('checkoutSlice extraReducers', () => {
  it('submitTransaction.pending sets submitting status and clears any previous error', () => {
    const state = checkoutReducer(
      { ...initialState, submitError: 'stale error' },
      { type: submitTransaction.pending.type },
    );

    expect(state.submitStatus).toBe('submitting');
    expect(state.submitError).toBeNull();
  });

  it('submitTransaction.rejected falls back to action.error.message when there is no payload', () => {
    const state = checkoutReducer(initialState, {
      type: submitTransaction.rejected.type,
      payload: undefined,
      error: { message: 'network down' },
    });

    expect(state.submitStatus).toBe('failed');
    expect(state.submitError).toBe('network down');
  });

  it('submitTransaction.rejected falls back to a generic message otherwise', () => {
    const state = checkoutReducer(initialState, {
      type: submitTransaction.rejected.type,
      payload: undefined,
      error: {},
    });

    expect(state.submitError).toBe('Payment failed');
  });
});

describe('submitTransaction thunk', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('rejects with a specific message when checkout data is incomplete', async () => {
    const store = buildStore();
    store.dispatch({ type: 'product/fetch/fulfilled', payload: product });

    await store.dispatch(submitTransaction());

    expect(api.createTransaction).not.toHaveBeenCalled();
    expect(store.getState().checkout.submitStatus).toBe('failed');
    expect(store.getState().checkout.submitError).toBe('Missing checkout data');
  });

  it('approves the transaction and moves to STATUS on success', async () => {
    jest.spyOn(api, 'createTransaction').mockResolvedValue({
      transactionId: 'tx-1',
      status: 'APPROVED',
      totalInCents: 2630000,
    });
    const store = buildStore();
    store.dispatch({ type: 'product/fetch/fulfilled', payload: product });
    store.dispatch(
      submitCheckoutForm({ customer, delivery, cardToken: 'tok_stagtest_1', installments: 1 }),
    );

    await store.dispatch(submitTransaction());

    expect(api.createTransaction).toHaveBeenCalledWith({
      productId: 'prod-1',
      customer,
      delivery,
      cardToken: 'tok_stagtest_1',
      installments: 1,
    });
    const state = store.getState().checkout;
    expect(state.submitStatus).toBe('succeeded');
    expect(state.step).toBe('STATUS');
    expect(state.transactionId).toBe('tx-1');
    expect(state.transactionStatus).toBe('APPROVED');
  });

  it('sets submitError from the ApiError message on failure', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue(new api.ApiError('Out of stock', 422));
    const store = buildStore();
    store.dispatch({ type: 'product/fetch/fulfilled', payload: product });
    store.dispatch(
      submitCheckoutForm({ customer, delivery, cardToken: 'tok_stagtest_1', installments: 1 }),
    );

    await store.dispatch(submitTransaction());

    const state = store.getState().checkout;
    expect(state.submitStatus).toBe('failed');
    expect(state.submitError).toBe('Out of stock');
    expect(state.step).toBe('SUMMARY');
  });

  it('falls back to a generic message when a non-Error value is thrown', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue('unexpected string rejection');
    const store = buildStore();
    store.dispatch({ type: 'product/fetch/fulfilled', payload: product });
    store.dispatch(
      submitCheckoutForm({ customer, delivery, cardToken: 'tok_stagtest_1', installments: 1 }),
    );

    await store.dispatch(submitTransaction());

    expect(store.getState().checkout.submitError).toBe('Payment failed');
  });
});

describe('refreshTransactionStatus thunk', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates transactionStatus from the backend', async () => {
    jest.spyOn(api, 'getTransaction').mockResolvedValue({
      id: 'tx-1',
      productId: 'prod-1',
      customerId: 'cust-1',
      productAmountInCents: 25000_00,
      baseFeeInCents: 500_00,
      deliveryFeeInCents: 800_00,
      status: 'APPROVED',
      totalInCents: 2630000,
    });
    const store = buildStore();

    await store.dispatch(refreshTransactionStatus('tx-1'));

    expect(api.getTransaction).toHaveBeenCalledWith('tx-1');
    expect(store.getState().checkout.transactionStatus).toBe('APPROVED');
  });
});
