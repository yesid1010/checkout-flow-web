import { configureStore } from '@reduxjs/toolkit';

// Placeholder root reducer: replaced by real slices as they land
// (RTK's configureStore rejects an empty reducer map).
const noopReducer = (state: Record<string, never> = {}) => state;

export const store = configureStore({
  reducer: noopReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
