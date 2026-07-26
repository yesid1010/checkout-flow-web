// Jest substitute for env.ts: `import.meta.env` can't be parsed under
// ts-jest's CommonJS module target, so jest.config.cjs redirects any
// import of `config/env` to this file instead.
export const API_BASE_URL = 'http://localhost:3000';
