import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProduct, type ProductDto } from '../../services/api';

export type ProductStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductState {
  data: ProductDto | null;
  status: ProductStatus;
  error: string | null;
}

const initialState: ProductState = {
  data: null,
  status: 'idle',
  error: null,
};

export const fetchProduct = createAsyncThunk('product/fetch', (productId: string) =>
  getProduct(productId),
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load product';
      });
  },
});

export default productSlice.reducer;
