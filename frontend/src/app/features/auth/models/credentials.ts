import { Role } from '@core/auth/account';

export type RegistrableRole = Extract<Role, 'CUSTOMER' | 'OWNER'>;

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration {
  name: string;
  email: string;
  password: string;
  role: RegistrableRole;
}
