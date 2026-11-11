import { actionFor } from './account-action';
import { AccountSummary } from './account-summary';

function account(overrides: Partial<AccountSummary>): AccountSummary {
  return {
    id: 7,
    name: 'Ana Rojas',
    email: 'ana@correo.com',
    role: 'CUSTOMER',
    suspended: false,
    ...overrides,
  };
}

describe('actionFor', () => {
  it.each([
    ['an active customer', account({}), 'suspend'],
    ['an active owner', account({ role: 'OWNER' }), 'suspend'],
    ['a suspended customer', account({ suspended: true }), 'reactivate'],
    ['a suspended owner', account({ role: 'OWNER', suspended: true }), 'reactivate'],
    ['an admin', account({ role: 'ADMIN' }), null],
  ])('offers the right action for %s', (_case, summary, action) => {
    expect(actionFor(summary)).toBe(action);
  });
});
