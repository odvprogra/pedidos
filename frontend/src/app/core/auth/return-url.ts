export const LOG_IN_PATH = '/ingresar';
export const REGISTER_PATH = '/registro';

const HOME_PATH = '/';
const GUEST_PATHS = [LOG_IN_PATH, REGISTER_PATH];

export function safeReturnUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return HOME_PATH;
  }
  const path = url.split(/[?#]/)[0];
  return GUEST_PATHS.includes(path) ? HOME_PATH : url;
}
