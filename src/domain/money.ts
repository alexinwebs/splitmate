/**
 * Money is always integer paise. This formats paise for display using
 * Indian digit grouping (e.g. 123456 rupees -> 1,23,456).
 * Phase 3 adds tests and the arithmetic helpers next to this file.
 */
function groupIndian(rupees: number): string {
  const digits = String(rupees);
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

export function formatMoney(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const decimals = rem === 0 ? '' : `.${String(rem).padStart(2, '0')}`;
  return `${negative ? '-' : ''}₹${groupIndian(rupees)}${decimals}`;
}
