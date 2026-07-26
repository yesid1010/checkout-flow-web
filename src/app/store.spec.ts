import { store } from './store';

describe('store', () => {
  it('creates a store with a working dispatch and getState', () => {
    expect(typeof store.dispatch).toBe('function');
    expect(store.getState()).toEqual({});
  });
});
