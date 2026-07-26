// Jest substitute for env.ts: `import.meta.env` can't be parsed under
// ts-jest's CommonJS module target, so jest.config.cjs redirects any
// import of `config/env` to this file instead.
export const API_BASE_URL = 'http://localhost:3000';
export const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
export const WOMPI_PUBLIC_KEY = 'pub_stagtest_xxx';
export const WOMPI_BASE_URL = 'https://api-sandbox.co.uat.wompi.dev/v1';
