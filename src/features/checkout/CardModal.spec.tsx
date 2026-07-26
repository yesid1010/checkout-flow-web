import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as wompi from '../../services/wompi';
import { WompiError } from '../../services/wompi';
import productReducer from '../product/productSlice';
import { CardModal } from './CardModal';
import checkoutReducer, { openCheckoutModal } from './checkoutSlice';

jest.mock('../../services/wompi', () => ({
  ...jest.requireActual('../../services/wompi'),
  tokenizeCard: jest.fn(),
}));

const buildStore = () => {
  const store = configureStore({ reducer: { product: productReducer, checkout: checkoutReducer } });
  store.dispatch(openCheckoutModal());
  return store;
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Jane Doe');
  await user.type(screen.getByLabelText('Correo electrónico'), 'jane@example.com');
  await user.type(screen.getByLabelText('Número de documento'), '123456789');
  await user.type(screen.getByLabelText('Teléfono'), '3001112233');
  await user.type(screen.getByLabelText('Número de tarjeta'), '4111111111111111');
  await user.type(screen.getByLabelText('Nombre en la tarjeta'), 'JANE DOE');
  await user.type(screen.getByLabelText('Mes de expiración'), '12');
  await user.type(screen.getByLabelText('Año de expiración'), '29');
  await user.type(screen.getByLabelText('CVC'), '123');
  await user.type(screen.getByLabelText('Dirección'), 'Cra 7 # 45-12');
  await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');
}

describe('CardModal', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing when the checkout step is not CHECKOUT_MODAL', () => {
    const store = configureStore({
      reducer: { product: productReducer, checkout: checkoutReducer },
    });

    const { container } = render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the form when the checkout step is CHECKOUT_MODAL', () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    expect(screen.getByRole('dialog', { name: 'Datos de pago' })).toBeInTheDocument();
  });

  it('shows the detected card brand while typing', async () => {
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await user.type(screen.getByLabelText('Número de tarjeta'), '4111111111111111');

    expect(screen.getByText('visa')).toBeInTheDocument();
  });

  it('dispatches closeCheckoutModal when Cancel is clicked', async () => {
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });

  it('shows an inline error and never calls tokenizeCard when the card fails the Luhn check', async () => {
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.clear(screen.getByLabelText('Número de tarjeta'));
    await user.type(screen.getByLabelText('Número de tarjeta'), '4111111111111112');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El número de tarjeta no es válido.',
    );
    expect(wompi.tokenizeCard).not.toHaveBeenCalled();
  });

  it('tokenizes the card and moves to SUMMARY on success', async () => {
    jest.spyOn(wompi, 'tokenizeCard').mockResolvedValue('tok_stagtest_1');
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), 'CE');
    await user.clear(screen.getByLabelText('Cuotas'));
    await user.type(screen.getByLabelText('Cuotas'), '3');
    await user.type(screen.getByLabelText('Detalles adicionales (opcional)'), 'Apto 302');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(store.getState().checkout.step).toBe('SUMMARY'));

    expect(wompi.tokenizeCard).toHaveBeenCalledWith({
      number: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '29',
      cardHolder: 'JANE DOE',
    });

    const state = store.getState().checkout;
    expect(state.step).toBe('SUMMARY');
    expect(state.cardToken).toBe('tok_stagtest_1');
    expect(state.installments).toBe(3);
    expect(state.customer).toEqual({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      documentType: 'CE',
      documentNumber: '123456789',
      phoneNumber: '3001112233',
    });
    expect(state.delivery).toEqual({
      recipientName: 'Jane Doe',
      recipientPhone: '3001112233',
      address: 'Cra 7 # 45-12',
      city: 'Bogotá',
      addressDetails: 'Apto 302',
    });
  });

  it('omits addressDetails when left blank', async () => {
    jest.spyOn(wompi, 'tokenizeCard').mockResolvedValue('tok_stagtest_1');
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(store.getState().checkout.step).toBe('SUMMARY'));

    expect(store.getState().checkout.delivery?.addressDetails).toBeUndefined();
  });

  it('shows the WompiError message when tokenization is declined', async () => {
    jest.spyOn(wompi, 'tokenizeCard').mockRejectedValue(new WompiError('Tarjeta rechazada'));
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tarjeta rechazada');
    expect(store.getState().checkout.step).toBe('CHECKOUT_MODAL');
  });

  it('shows a generic message when a non-WompiError is thrown during tokenization', async () => {
    jest.spyOn(wompi, 'tokenizeCard').mockRejectedValue(new Error('network down'));
    const store = buildStore();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CardModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo procesar la tarjeta.',
    );
  });
});
