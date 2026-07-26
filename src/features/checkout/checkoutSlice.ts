import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import {
  createTransaction,
  getTransaction,
  type CreateTransactionPayload,
  type DocumentType,
  type TransactionStatus,
} from '../../services/api';
import { clearCheckoutState, loadCheckoutState } from './persist';

export type CheckoutStep = 'PRODUCT' | 'CHECKOUT_MODAL' | 'SUMMARY' | 'STATUS';
export type SubmitStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

export interface CustomerFormData {
  fullName: string;
  email: string;
  documentType: DocumentType;
  documentNumber: string;
  phoneNumber: string;
}

export interface DeliveryFormData {
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  addressDetails?: string;
}

export interface CheckoutState {
  step: CheckoutStep;
  customer: CustomerFormData | null;
  delivery: DeliveryFormData | null;
  cardToken: string | null;
  installments: number;
  transactionId: string | null;
  transactionStatus: TransactionStatus | null;
  submitStatus: SubmitStatus;
  submitError: string | null;
}

const defaultState: CheckoutState = {
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

/**
 * A refresh mid-request leaves a persisted "submitting" state we can never
 * resolve (the in-flight request is gone) - reset it to idle so the user
 * isn't stuck looking at a disabled "Procesando..." button forever.
 */
export function sanitizeRehydratedState(state: CheckoutState): CheckoutState {
  if (state.submitStatus === 'submitting') {
    return { ...state, submitStatus: 'idle', submitError: null };
  }
  return state;
}

const initialState: CheckoutState = sanitizeRehydratedState(loadCheckoutState() ?? defaultState);

export const submitTransaction = createAsyncThunk<
  { transactionId: string; status: TransactionStatus },
  void,
  { state: RootState; rejectValue: string }
>('checkout/submitTransaction', async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const product = state.product.data;
  const { customer, delivery, cardToken, installments } = state.checkout;

  if (!product || !customer || !delivery || !cardToken) {
    return rejectWithValue('Missing checkout data');
  }

  const payload: CreateTransactionPayload = {
    productId: product.id,
    customer,
    delivery,
    cardToken,
    installments,
  };

  try {
    const outcome = await createTransaction(payload);
    return { transactionId: outcome.transactionId, status: outcome.status };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Payment failed');
  }
});

export const refreshTransactionStatus = createAsyncThunk(
  'checkout/refreshTransactionStatus',
  async (transactionId: string) => {
    const transaction = await getTransaction(transactionId);
    return transaction.status;
  },
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    openCheckoutModal(state) {
      state.step = 'CHECKOUT_MODAL';
    },
    closeCheckoutModal(state) {
      state.step = 'PRODUCT';
    },
    submitCheckoutForm(
      state,
      action: PayloadAction<{
        customer: CustomerFormData;
        delivery: DeliveryFormData;
        cardToken: string;
        installments: number;
      }>,
    ) {
      state.customer = action.payload.customer;
      state.delivery = action.payload.delivery;
      state.cardToken = action.payload.cardToken;
      state.installments = action.payload.installments;
      state.step = 'SUMMARY';
    },
    resetCheckout() {
      clearCheckoutState();
      return defaultState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTransaction.pending, (state) => {
        state.submitStatus = 'submitting';
        state.submitError = null;
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.transactionId = action.payload.transactionId;
        state.transactionStatus = action.payload.status;
        state.step = 'STATUS';
      })
      .addCase(submitTransaction.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload ?? action.error.message ?? 'Payment failed';
      })
      .addCase(refreshTransactionStatus.fulfilled, (state, action) => {
        state.transactionStatus = action.payload;
      });
  },
});

export const { openCheckoutModal, closeCheckoutModal, submitCheckoutForm, resetCheckout } =
  checkoutSlice.actions;
export default checkoutSlice.reducer;
