import { detectCardBrand } from './cardBrand';

describe('detectCardBrand', () => {
  it('detects Visa from a leading 4', () => {
    expect(detectCardBrand('4111111111111111')).toBe('visa');
  });

  it.each(['51', '52', '53', '54', '55'])(
    'detects Mastercard from the legacy 5x range (%s)',
    (prefix) => {
      expect(detectCardBrand(`${prefix}55555555554444`)).toBe('mastercard');
    },
  );

  it.each(['2221', '2229', '2230', '2500', '2699', '2700', '2719', '2720'])(
    'detects Mastercard from the 2-series range (%s)',
    (prefix) => {
      expect(detectCardBrand(`${prefix}00000000000`)).toBe('mastercard');
    },
  );

  it('does not detect Mastercard just below the 2-series range (2220)', () => {
    expect(detectCardBrand('222000000000000')).toBe('unknown');
  });

  it('does not detect Mastercard just above the 2-series range (2721)', () => {
    expect(detectCardBrand('272100000000000')).toBe('unknown');
  });

  it('returns unknown for other brands (Amex)', () => {
    expect(detectCardBrand('378282246310005')).toBe('unknown');
  });

  it('ignores spaces and dashes', () => {
    expect(detectCardBrand('4111 1111 1111 1111')).toBe('visa');
  });

  it('returns unknown for an empty string', () => {
    expect(detectCardBrand('')).toBe('unknown');
  });
});
