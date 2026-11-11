import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps an internal path with its query', () => {
    expect(safeReturnUrl('/pedidos/12?vista=detalle', '/')).toBe('/pedidos/12?vista=detalle');
  });

  it.each([
    ['a missing url', undefined],
    ['an empty url', ''],
    ['an absolute url', 'https://otro-sitio.com'],
    ['a protocol relative url', '//otro-sitio.com'],
    ['a backslash url', '/\\otro-sitio.com'],
    ['a relative path', 'pedidos'],
    ['the log in page', '/ingresar?returnUrl=/pedidos'],
    ['the register page', '/registro'],
  ])('falls back to the home of the account for %s', (_case, url) => {
    expect(safeReturnUrl(url, '/admin')).toBe('/admin');
  });
});
