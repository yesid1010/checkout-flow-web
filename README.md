# checkout-flow-web

Single-product checkout SPA built with React + TypeScript + Redux Toolkit, mobile-first (iPhone SE reference viewport). Talks to [checkout-flow-api](https://github.com/yesid1010/checkout-flow-api) and tokenizes cards directly against [Wompi](https://wompi.co) (Sandbox) with the public key.

Backend repo: [checkout-flow-api](https://github.com/yesid1010/checkout-flow-api)

## Live deploy

- App: https://checkout-flow-web-production.up.railway.app

## Screens

1. **Product** — description, price, stock, "Pagar con tarjeta".
2. **Card + delivery modal** — customer, card (Luhn check + Visa/Mastercard brand detection), delivery data. On submit, the card is tokenized directly against Wompi; only the resulting token is stored, never the raw card number.
3. **Summary backdrop** — product amount + base fee + delivery fee = total, "Pagar" triggers the actual charge against the backend.
4. **Status** — final result (approved / declined / error), re-checks automatically if still pending.
5. Back to product, which re-fetches to show updated stock.

Progress (current step, customer/delivery data, card token, transaction result) persists to `localStorage`, so a page refresh at any point resumes exactly where the user left off.

## Architecture

```
src/
├── app/            store.ts, hooks.ts (typed useAppDispatch/useAppSelector)
├── features/
│   ├── product/     ProductPage, productSlice
│   └── checkout/     CardModal, SummaryBackdrop, StatusPage, checkoutSlice, persist.ts
├── components/ui/   Button
├── services/        api.ts (checkout-flow-api client), wompi.ts (direct Wompi tokenization)
├── lib/             luhn.ts, cardBrand.ts, fees.ts, useBodyScrollLock.ts
└── config/env.ts    Vite env vars (import.meta.env), isolated for Jest compatibility
```

Redux Toolkit slices, `createAsyncThunk` for all async flows. No component talks to `fetch` directly — everything goes through `services/`.

## Getting started

```bash
cp .env.example .env.local   # see below
npm install
npm run dev
```

The app runs on `http://localhost:5180` (pinned in `vite.config.ts` to avoid clashing with other local projects on the default 5173). The checkout-flow-api's `FRONTEND_URL` must match it for CORS.

### Environment variables

See [.env.example](.env.example):

- `VITE_API_URL` — checkout-flow-api base URL.
- `VITE_PRODUCT_ID` — the featured product id (this is a single-product checkout SPA).
- `VITE_WOMPI_PUBLIC_KEY` / `VITE_WOMPI_BASE_URL` — Wompi Sandbox public key, used only for card tokenization from the browser.

## Testing

```bash
npm test          # unit + component tests
npm run test:cov  # with coverage report
```

Coverage threshold enforced in `jest.config.cjs`: **80%** on branches/functions/lines/statements.

Current results: **100%** on every metric, across every file in `src/`.

## Tech stack

React · TypeScript · Redux Toolkit · Vite · Jest · React Testing Library · Wompi (Sandbox)
