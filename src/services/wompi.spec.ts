import { tokenizeCard, WompiError, type TokenizeCardInput } from './wompi';

function mockFetchOnce(response: { ok: boolean; json: () => Promise<unknown> }) {
  globalThis.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

const input: TokenizeCardInput = {
  number: '4111111111111111',
  cvc: '123',
  expMonth: '12',
  expYear: '29',
  cardHolder: 'Jane Doe',
};

describe('tokenizeCard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the token id on success', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ data: { id: 'tok_stagtest_1' } }) });

    const token = await tokenizeCard(input);

    expect(fetch).toHaveBeenCalledWith(
      'https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer pub_stagtest_xxx',
        }),
        body: JSON.stringify({
          number: '4111111111111111',
          cvc: '123',
          exp_month: '12',
          exp_year: '29',
          card_holder: 'Jane Doe',
        }),
      }),
    );
    expect(token).toBe('tok_stagtest_1');
  });

  it('throws a WompiError with the joined field messages on failure', async () => {
    mockFetchOnce({
      ok: false,
      json: async () => ({
        error: { messages: { number: ['is invalid'], cvc: ['is required'] } },
      }),
    });

    await expect(tokenizeCard(input)).rejects.toMatchObject({
      name: 'WompiError',
      message: 'is invalid, is required',
    });
    expect(tokenizeCard(input)).rejects.toBeInstanceOf(WompiError);
  });

  it('falls back to a generic message when the error body has no field messages', async () => {
    mockFetchOnce({ ok: false, json: async () => ({}) });

    await expect(tokenizeCard(input)).rejects.toMatchObject({
      message: 'No se pudo validar la tarjeta',
    });
  });

  it('falls back to a generic message when the error body is not valid JSON', async () => {
    mockFetchOnce({
      ok: false,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(tokenizeCard(input)).rejects.toMatchObject({
      message: 'No se pudo validar la tarjeta',
    });
  });
});
