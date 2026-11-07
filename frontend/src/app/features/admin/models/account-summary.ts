import { Role } from '@core/auth/account';

export interface AccountSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
  suspended: boolean;
}
