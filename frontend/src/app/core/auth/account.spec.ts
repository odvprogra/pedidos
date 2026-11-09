import { Account, Role, canShop } from './account';

function accountWith(role: Role): Account {
  return { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role };
}

describe('canShop', () => {
  it('lets a visitor without a session and a customer fill a cart', () => {
    expect(canShop(null)).toBe(true);
    expect(canShop(accountWith('CUSTOMER'))).toBe(true);
  });

  it.each<Role>(['OWNER', 'ADMIN'])('keeps the cart away from an account of role %s', (role) => {
    expect(canShop(accountWith(role))).toBe(false);
  });
});
