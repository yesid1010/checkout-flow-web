import { isValidLuhn } from './luhn';

describe('isValidLuhn', () => {
  it.each([
    '4111111111111111', // Visa test number
    '5555555555554444', // Mastercard test number
    '378282246310005', // Amex test number
  ])('accepts the valid test card %s', (card) => {
    expect(isValidLuhn(card)).toBe(true);
  });

  it('accepts a card number with spaces or dashes', () => {
    expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
    expect(isValidLuhn('4111-1111-1111-1111')).toBe(true);
  });

  it('rejects a card number that fails the checksum', () => {
    expect(isValidLuhn('4111111111111112')).toBe(false);
  });

  it('rejects a card number shorter than 12 digits', () => {
    expect(isValidLuhn('411111')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidLuhn('')).toBe(false);
  });
});
