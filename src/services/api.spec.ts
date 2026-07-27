import {
  ApiError,
  createTransaction,
  getProduct,
  getTransaction,
  type CreateTransactionPayload,
} from './api';

function mockFetchOnce(response: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<unknown>;
}) {
  globalThis.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('api service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProduct', () => {
    it('returns the parsed product on success', async () => {
      const product = {
        id: 'prod-1',
        name: 'Wireless Headphones',
        description: 'Noise-cancelling',
        priceInCents: 25000_00,
        imageUrl: 'https://tissiniapp.s3.us-east-2.amazonaws.com/img/products/1000x1000/534919_0.jpg',
        stock: 5,
      };
      mockFetchOnce({ ok: true, json: async () => product });

      const result = await getProduct('prod-1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/products/prod-1',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
      expect(result).toEqual(product);
    });

    it('throws ApiError with the backend message on failure', async () => {
      mockFetchOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Product not found' }),
      });

      await expect(getProduct('missing')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Product not found',
        status: 404,
      });
    });

    it('joins an array validation message into a single string', async () => {
      mockFetchOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: ['field a is required', 'field b is invalid'] }),
      });

      await expect(getProduct('bad')).rejects.toMatchObject({
        message: 'field a is required, field b is invalid',
      });
    });

    it('falls back to statusText when the error body is not valid JSON', async () => {
      mockFetchOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('not json');
        },
      });

      await expect(getProduct('prod-1')).rejects.toMatchObject({
        message: 'Internal Server Error',
        status: 500,
      });
    });
  });

  describe('createTransaction', () => {
    const payload: CreateTransactionPayload = {
      productId: 'prod-1',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        documentType: 'CC',
        documentNumber: '123456789',
        phoneNumber: '+573001112233',
      },
      delivery: {
        recipientName: 'Jane Doe',
        recipientPhone: '+573001112233',
        address: 'Cra 7 # 45-12',
        city: 'Bogotá',
      },
      cardToken: 'tok_stagtest_1',
      installments: 1,
    };

    it('posts the payload as JSON and returns the outcome', async () => {
      const outcome = { transactionId: 'tx-1', status: 'APPROVED', totalInCents: 2630000 };
      mockFetchOnce({ ok: true, json: async () => outcome });

      const result = await createTransaction(payload);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
      expect(result).toEqual(outcome);
    });
  });

  describe('getTransaction', () => {
    it('returns the parsed transaction on success', async () => {
      const transaction = { id: 'tx-1', status: 'APPROVED' };
      mockFetchOnce({ ok: true, json: async () => transaction });

      const result = await getTransaction('tx-1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions/tx-1',
        expect.anything(),
      );
      expect(result).toEqual(transaction);
    });
  });

  it('ApiError carries the HTTP status', () => {
    const error = new ApiError('boom', 422);

    expect(error.message).toBe('boom');
    expect(error.status).toBe(422);
    expect(error.name).toBe('ApiError');
  });
});
