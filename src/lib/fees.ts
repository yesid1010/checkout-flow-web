// Mirrors checkout-flow-api's fees.ts: the backend is the source of truth
// for the actual charge, but the summary screen needs the same numbers to
// preview a total that matches what will really be charged.
export const BASE_FEE_IN_CENTS = 500_00;
export const DELIVERY_FEE_IN_CENTS = 800_00;
