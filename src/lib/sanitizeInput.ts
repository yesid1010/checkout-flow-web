export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function digitsWithOptionalLeadingPlus(value: string): string {
  const hasPlus = value.startsWith('+');
  const digits = onlyDigits(value);
  return hasPlus ? `+${digits}` : digits;
}

export function digitsAndSpaces(value: string): string {
  return value.replace(/[^\d\s]/g, '');
}
