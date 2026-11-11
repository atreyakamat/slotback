/**
 * Indian mobile numbers. Stored in one display format, "+91 98765 43210", so the same
 * person is recognised however they type their number.
 */

/** Normalises an Indian mobile number, or returns null if it is not one. */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** "+91 98765 43210" → "+91 ••••• •3210", for staff screens and logs. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length < 4 ? "••••" : `+91 ••••• •${digits.slice(-4)}`;
}
