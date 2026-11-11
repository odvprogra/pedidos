import { homeFor } from './home-path';

describe('homeFor', () => {
  it.each([
    ['CUSTOMER', '/'],
    ['OWNER', '/'],
    ['ADMIN', '/admin'],
  ] as const)('sends a %s to %s', (role, path) => {
    expect(homeFor(role)).toBe(path);
  });
});
