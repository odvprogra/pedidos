import { Role } from './account';
import { ADMIN_PATH } from './auth-paths';

const HOME_PATHS: Record<Role, string> = {
  CUSTOMER: '/',
  OWNER: '/',
  ADMIN: ADMIN_PATH,
};

export function homeFor(role: Role): string {
  return HOME_PATHS[role];
}
