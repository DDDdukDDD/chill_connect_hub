/** Same-site path only (never "//host" or an absolute URL), and never back to an auth screen */
export function safeReturnPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/^\/(login|onboarding|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value.slice(0, 300);
}
