export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// This is a single-product checkout SPA; the featured product id defaults
// to the first dummy product seeded in checkout-flow-api.
export const PRODUCT_ID: string =
  import.meta.env.VITE_PRODUCT_ID ?? '11111111-1111-4111-8111-111111111111';

// Card tokenization is called directly from the browser with the PUBLIC
// key only - the private/integrity keys never leave checkout-flow-api.
export const WOMPI_PUBLIC_KEY: string = import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? '';
export const WOMPI_BASE_URL: string =
  import.meta.env.VITE_WOMPI_BASE_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1';
