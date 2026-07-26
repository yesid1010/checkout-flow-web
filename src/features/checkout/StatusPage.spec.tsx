import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as api from '../../services/api';
import productReducer from '../product/productSlice';
import { StatusPage } from './StatusPage';
import checkoutReducer, { type CheckoutState } from './checkoutSlice';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  getTransaction: jest.fn(),
}));

const baseCheckoutState: CheckoutState = {
  step: 'STATUS',
  customer: null,
  delivery: null,
  cardToken: 'tok_stagtest_1',
  installments: 1,
  transactionId: 'tx-1',
  transactionStatus: 'APPROVED',
  submitStatus: 'succeeded',
  submitError: null,
};

const buildStore = (checkoutOverrides: Partial<CheckoutState> = {}) =>
  configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer },
    preloadedState: { checkout: { ...baseCheckoutState, ...checkoutOverrides } },
  });

describe('StatusPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('renders nothing when the checkout step is not STATUS', () => {
    const store = buildStore({ step: 'PRODUCT' });

    const { container } = render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the approved copy', () => {
    const store = buildStore({ transactionStatus: 'APPROVED' });

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: '¡Pago aprobado!' })).toBeInTheDocument();
  });

  it('shows the declined copy', () => {
    const store = buildStore({ transactionStatus: 'DECLINED' });

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Pago rechazado' })).toBeInTheDocument();
  });

  it('shows the error copy', () => {
    const store = buildStore({ transactionStatus: 'ERROR' });

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Ocurrió un error' })).toBeInTheDocument();
  });

  it('falls back to the error copy when there is no transaction status', () => {
    const store = buildStore({ transactionStatus: null });

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Ocurrió un error' })).toBeInTheDocument();
  });

  it('refreshes the status when it is still PENDING on mount', async () => {
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
    const store = buildStore({ transactionStatus: 'PENDING' });

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    expect(api.getTransaction).toHaveBeenCalledWith('tx-1');
    await waitFor(() => expect(store.getState().checkout.transactionStatus).toBe('APPROVED'));
  });

  it('resets checkout and returns to PRODUCT when "Volver a la tienda" is clicked', async () => {
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Volver a la tienda' }));

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });
});
