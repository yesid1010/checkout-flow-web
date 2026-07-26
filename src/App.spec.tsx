import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import * as api from './services/api';
import App from './App';
import checkoutReducer, { type CheckoutState } from './features/checkout/checkoutSlice';
import productReducer from './features/product/productSlice';

jest.mock('./services/api', () => ({
  ...jest.requireActual('./services/api'),
  getProduct: jest.fn(),
}));

const product = {
  id: 'prod-1',
  name: 'Wireless Headphones',
  description: 'Noise-cancelling',
  priceInCents: 25000_00,
  stock: 5,
};

const baseCheckout: CheckoutState = {
  step: 'PRODUCT',
  customer: null,
  delivery: null,
  cardToken: null,
  installments: 1,
  transactionId: null,
  transactionStatus: 'APPROVED',
  submitStatus: 'idle',
  submitError: null,
};

const buildStore = (checkoutOverrides: Partial<CheckoutState> = {}) =>
  configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer },
    preloadedState: { checkout: { ...baseCheckout, ...checkoutOverrides } },
  });

describe('App', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the ProductPage on the PRODUCT step', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue(product);
    const store = buildStore({ step: 'PRODUCT' });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(await screen.findByRole('heading', { name: 'Wireless Headphones' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders ProductPage with the CardModal open on the CHECKOUT_MODAL step', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue(product);
    const store = buildStore({ step: 'CHECKOUT_MODAL' });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(await screen.findByRole('heading', { name: 'Wireless Headphones' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Datos de pago' })).toBeInTheDocument();
  });

  it('renders the StatusPage exclusively on the STATUS step', () => {
    jest.spyOn(api, 'getProduct').mockReturnValue(new Promise(() => {}));
    const store = buildStore({ step: 'STATUS' });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: '¡Pago aprobado!' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
