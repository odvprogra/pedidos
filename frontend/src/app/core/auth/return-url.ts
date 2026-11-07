import { LOG_IN_PATH, REGISTER_PATH } from './auth-paths';

const GUEST_PATHS = [LOG_IN_PATH, REGISTER_PATH];

export function safeReturnUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return fallback;
  }
  const path = url.split(/[?#]/)[0];
  return GUEST_PATHS.includes(path) ? fallback : url;
}
