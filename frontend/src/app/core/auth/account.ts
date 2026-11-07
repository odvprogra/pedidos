export type Role = 'CUSTOMER' | 'OWNER' | 'ADMIN';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Cliente',
  OWNER: 'Dueño de restaurante',
  ADMIN: 'Administrador',
};
