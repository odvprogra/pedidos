import { LOG_IN_PATH, REGISTER_PATH } from './auth-paths';

const HOME_PATH = '/';
const GUEST_PATHS = [LOG_IN_PATH, REGISTER_PATH];

export function safeReturnUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return HOME_PATH;
  }
  const path = url.split(/[?#]/)[0];
  return GUEST_PATHS.includes(path) ? HOME_PATH : url;
}
