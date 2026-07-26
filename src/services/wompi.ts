import { WOMPI_BASE_URL, WOMPI_PUBLIC_KEY } from '../config/env';

export interface TokenizeCardInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export class WompiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WompiError';
  }
}

interface WompiTokenResponse {
  data: { id: string };
}

interface WompiErrorResponse {
  error?: { messages?: Record<string, string[]> };
}

export async function tokenizeCard(input: TokenizeCardInput): Promise<string> {
  const response = await fetch(`${WOMPI_BASE_URL}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
    },
    body: JSON.stringify({
      number: input.number,
      cvc: input.cvc,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      card_holder: input.cardHolder,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as WompiErrorResponse | null;
    const messages = body?.error?.messages;
    const message = messages
      ? Object.values(messages).flat().join(', ')
      : 'No se pudo validar la tarjeta';
    throw new WompiError(message);
  }

  const body = (await response.json()) as WompiTokenResponse;
  return body.data.id;
}
