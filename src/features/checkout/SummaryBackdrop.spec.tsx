import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as api from '../../services/api';
import productReducer, { type ProductState } from '../product/productSlice';
import { SummaryBackdrop } from './SummaryBackdrop';
import checkoutReducer, { type CheckoutState } from './checkoutSlice';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  createTransaction: jest.fn(),
}));

function formatCurrency(cents: number): string {
  // Testing Library's default text normalizer collapses whitespace
  // (including the non-breaking space Intl inserts after "$") down to a
  // regular space, so the expected string needs the same normalization.
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
    .format(cents / 100)
    .replace(/\s+/g, ' ');
}

const productState: ProductState = {
  data: {
    id: 'prod-1',
    name: 'Wireless Headphones',
    description: 'Noise-cancelling',
    priceInCents: 25000_00,
    imageUrl: 'https://tissiniapp.s3.us-east-2.amazonaws.com/img/products/1000x1000/534919_0.jpg',
    stock: 5,
  },
  status: 'succeeded',
  error: null,
};

const summaryCheckoutState: CheckoutState = {
  step: 'SUMMARY',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '123456789',
    phoneNumber: '3001112233',
  },
  delivery: {
    recipientName: 'Jane Doe',
    recipientPhone: '3001112233',
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

const buildStore = (checkoutOverrides: Partial<CheckoutState> = {}) =>
  configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer },
    preloadedState: {
      product: productState,
      checkout: { ...summaryCheckoutState, ...checkoutOverrides },
    },
  });

describe('SummaryBackdrop', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing when the checkout step is not SUMMARY', () => {
    const store = buildStore({ step: 'PRODUCT' });

    const { container } = render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the product amount, fixed fees, and the computed total', () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByRole('dialog', { name: 'Resumen de pago' })).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(25000_00))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(500_00))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(800_00))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(25000_00 + 500_00 + 800_00))).toBeInTheDocument();
  });

  it('falls back to a $0 product amount when no product is loaded', () => {
    const store = configureStore({
      reducer: { product: productReducer, checkout: checkoutReducer },
      preloadedState: {
        product: { data: null, status: 'idle', error: null } satisfies ProductState,
        checkout: summaryCheckoutState,
      },
    });

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText(formatCurrency(500_00 + 800_00))).toBeInTheDocument();
  });

  it('resets checkout and returns to PRODUCT when Cancelar is clicked', async () => {
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });

  it('submits the transaction and moves to STATUS on approval', async () => {
    jest.spyOn(api, 'createTransaction').mockResolvedValue({
      transactionId: 'tx-1',
      status: 'APPROVED',
      totalInCents: 2_630_000,
    });
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => expect(store.getState().checkout.step).toBe('STATUS'));
    expect(store.getState().checkout.transactionStatus).toBe('APPROVED');
  });

  it('shows an inline error and stays on SUMMARY when the payment fails', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue(new api.ApiError('Tarjeta declinada', 422));
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tarjeta declinada');
    expect(store.getState().checkout.step).toBe('SUMMARY');
  });

  it('disables both buttons and shows a processing label while submitting', async () => {
    let resolvePromise: (value: {
      transactionId: string;
      status: 'APPROVED';
      totalInCents: number;
    }) => void = () => {};
    jest.spyOn(api, 'createTransaction').mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(await screen.findByRole('button', { name: 'Procesando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    resolvePromise({ transactionId: 'tx-1', status: 'APPROVED', totalInCents: 2_630_000 });
    await waitFor(() => expect(store.getState().checkout.step).toBe('STATUS'));
  });
});
