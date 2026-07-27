import { digitsAndSpaces, digitsWithOptionalLeadingPlus, onlyDigits } from './sanitizeInput';

describe('onlyDigits', () => {
  it('strips any non-digit character', () => {
    expect(onlyDigits('a1b2c3')).toBe('123');
    expect(onlyDigits('123-456')).toBe('123456');
    expect(onlyDigits('')).toBe('');
  });
});

describe('digitsWithOptionalLeadingPlus', () => {
  it('keeps a leading + and strips non-digits from the rest', () => {
    expect(digitsWithOptionalLeadingPlus('+57 300 111 2233')).toBe('+573001112233');
  });

  it('strips everything non-digit when there is no leading +', () => {
    expect(digitsWithOptionalLeadingPlus('300-111-2233')).toBe('3001112233');
  });

  it('does not add a + if the user never typed one', () => {
    expect(digitsWithOptionalLeadingPlus('abc')).toBe('');
  });
});

describe('digitsAndSpaces', () => {
  it('keeps digits and spaces, strips letters', () => {
    expect(digitsAndSpaces('4242 abc 4242 4242 4242')).toBe('4242  4242 4242 4242');
  });
});
