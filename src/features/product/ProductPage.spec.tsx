import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as api from '../../services/api';
import checkoutReducer from '../checkout/checkoutSlice';
import productReducer from './productSlice';
import { ProductPage } from './ProductPage';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  getProduct: jest.fn(),
}));

const buildStore = () =>
  configureStore({ reducer: { product: productReducer, checkout: checkoutReducer } });

const product = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Wireless Headphones',
  description: 'Noise-cancelling headphones',
  priceInCents: 259900,
  imageUrl: 'https://tissiniapp.s3.us-east-2.amazonaws.com/img/products/1000x1000/534919_0.jpg',
  stock: 5,
};

describe('ProductPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading state before the product arrives', () => {
    jest.spyOn(api, 'getProduct').mockReturnValue(new Promise(() => {}));
    const store = buildStore();

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Cargando producto');
  });

  it('renders the product once loaded', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue(product);
    const store = buildStore();

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Wireless Headphones' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Noise-cancelling headphones')).toBeInTheDocument();
    expect(screen.getByText('5 unidades disponibles')).toBeInTheDocument();
    expect(api.getProduct).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');

    const image = screen.getByRole('img', { name: 'Wireless Headphones' });
    expect(image).toHaveAttribute('src', product.imageUrl);
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('shows an error message when loading fails', async () => {
    jest.spyOn(api, 'getProduct').mockRejectedValue(new Error('network down'));
    const store = buildStore();

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('disables the pay button and shows out-of-stock messaging when stock is 0', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue({ ...product, stock: 0 });
    const store = buildStore();

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    expect(await screen.findByText('Sin stock disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar con tarjeta' })).toBeDisabled();
  });

  it('dispatches openCheckoutModal when the pay button is clicked', async () => {
    jest.spyOn(api, 'getProduct').mockResolvedValue(product);
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    const button = await screen.findByRole('button', { name: 'Pagar con tarjeta' });
    await user.click(button);

    expect(store.getState().checkout.step).toBe('CHECKOUT_MODAL');
  });
});
