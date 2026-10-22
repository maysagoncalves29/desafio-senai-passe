export type Cents = number;

// Arredonda numerator/denominator (denominator > 0) para o inteiro mais próximo, com o meio para longe do zero.
export function roundDiv(numerator: number, denominator: number): number {
  const sign = numerator < 0 ? -1 : 1;
  return sign * Math.floor((2 * Math.abs(numerator) + denominator) / (2 * denominator));
}

export function toCents(value: { toString(): string } | number): Cents {
  return Math.round(Number(value.toString()) * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

export function centsToDecimalString(cents: Cents): string {
  return (cents / 100).toFixed(2);
}
