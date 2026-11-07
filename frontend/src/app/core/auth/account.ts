export type Role = 'CUSTOMER' | 'OWNER' | 'ADMIN';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
}
