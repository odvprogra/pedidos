import { Role } from './account';
import { ADMIN_PATH, MY_RESTAURANT_PATH } from './auth-paths';

const HOME_PATHS: Record<Role, string> = {
  CUSTOMER: '/',
  OWNER: MY_RESTAURANT_PATH,
  ADMIN: ADMIN_PATH,
};

export function homeFor(role: Role): string {
  return HOME_PATHS[role];
}
