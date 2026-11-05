const UNITS: readonly string[] = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]

const TENS: readonly string[] = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
]

/**
 * Write a whole number from 0 to 99 in English words, as a person says a
 * price ("five", "twenty-one"). Anything else is returned as digits.
 */
export function numberInWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n)
  if (n < 20) return UNITS[n]
  const rest = n % 10
  return rest === 0
    ? TENS[n / 10]
    : `${TENS[Math.floor(n / 10)]}-${UNITS[rest]}`
}
