import crypto from 'crypto';

const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const ALPHANUMERIC_LOWER = LOWERCASE_CHARS + NUMBER_CHARS;

/**
 * Generate password acak 8 karakter berbasis RNG kriptografi aman (crypto.randomBytes).
 * Karakter hanya terdiri dari huruf kecil (a-z) dan angka (0-9) tanpa huruf kapital.
 * Menjamin hasil kombinasi selalu memiliki huruf kecil dan angka.
 */
export function generateSecurePassword(length = 8): string {
  while (true) {
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += ALPHANUMERIC_LOWER[bytes[i] % ALPHANUMERIC_LOWER.length];
    }

    // Pastikan mengandung setidaknya satu huruf kecil dan satu angka
    const hasLetter = /[a-z]/.test(result);
    const hasNumber = /[0-9]/.test(result);

    if (hasLetter && hasNumber) {
      return result;
    }
  }
}
