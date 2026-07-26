export type CardBrand = 'visa' | 'mastercard' | 'unknown';

const VISA_REGEX = /^4/;
const MASTERCARD_REGEX = /^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/;

export function detectCardBrand(cardNumber: string): CardBrand {
  const digitsOnly = cardNumber.replace(/\D/g, '');

  if (VISA_REGEX.test(digitsOnly)) {
    return 'visa';
  }
  if (MASTERCARD_REGEX.test(digitsOnly)) {
    return 'mastercard';
  }
  return 'unknown';
}
