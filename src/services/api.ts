import { API_BASE_URL } from '../config/env';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrl: string;
  stock: number;
}

export type DocumentType = 'CC' | 'CE' | 'TI' | 'PP' | 'NIT';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface CreateTransactionPayload {
  productId: string;
  customer: {
    fullName: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
    phoneNumber: string;
  };
  delivery: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    city: string;
    addressDetails?: string;
  };
  cardToken: string;
  installments: number;
}

export interface CreateTransactionOutcome {
  transactionId: string;
  status: TransactionStatus;
  totalInCents: number;
}

export interface TransactionDto {
  id: string;
  productId: string;
  customerId: string;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  status: TransactionStatus;
  gatewayReference?: string;
  totalInCents: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const rawMessage = body?.message ?? response.statusText;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function getProduct(id: string): Promise<ProductDto> {
  return request<ProductDto>(`/products/${id}`);
}

export function createTransaction(
  payload: CreateTransactionPayload,
): Promise<CreateTransactionOutcome> {
  return request<CreateTransactionOutcome>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTransaction(id: string): Promise<TransactionDto> {
  return request<TransactionDto>(`/transactions/${id}`);
}
