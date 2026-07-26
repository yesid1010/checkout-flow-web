import { configureStore } from '@reduxjs/toolkit';
import * as api from '../../services/api';
import productReducer, { fetchProduct, type ProductState } from './productSlice';

jest.mock('../../services/api');

const initialState: ProductState = { data: null, status: 'idle', error: null };

const product = {
  id: 'prod-1',
  name: 'Wireless Headphones',
  description: 'Noise-cancelling',
  priceInCents: 25000_00,
  stock: 5,
};

describe('productSlice', () => {
  it('returns the initial state', () => {
    expect(productReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('sets status to loading and clears any previous error on pending', () => {
    const previousState: ProductState = { ...initialState, error: 'stale error' };

    const state = productReducer(previousState, { type: fetchProduct.pending.type });

    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the product and marks status succeeded on fulfilled', () => {
    const state = productReducer(initialState, {
      type: fetchProduct.fulfilled.type,
      payload: product,
    });

    expect(state.status).toBe('succeeded');
    expect(state.data).toEqual(product);
  });

  it('sets the error message and marks status failed on rejected', () => {
    const state = productReducer(initialState, {
      type: fetchProduct.rejected.type,
      error: { message: 'Network error' },
    });

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic error message when none is provided', () => {
    const state = productReducer(initialState, {
      type: fetchProduct.rejected.type,
      error: {},
    });

    expect(state.error).toBe('Failed to load product');
  });
});

describe('fetchProduct thunk', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls getProduct and stores the result on success', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue(product);
    const store = configureStore({ reducer: { product: productReducer } });

    await store.dispatch(fetchProduct('prod-1'));

    expect(api.getProduct).toHaveBeenCalledWith('prod-1');
    expect(store.getState().product).toEqual({
      data: product,
      status: 'succeeded',
      error: null,
    });
  });
});
