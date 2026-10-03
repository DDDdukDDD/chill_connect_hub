/**
 * Utility for handling admin API response statuses.
 * If 401 Unauthorized is returned, it indicates that the admin session
 * has expired or is invalid. Triggers a window reload so AdminAuthGate
 * presents the login form.
 */
export function handleAdminUnauthorized(res: Response): boolean {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return true;
  }
  return false;
}
