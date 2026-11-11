import { describeCatalogError, isMenuOutdated, isNameTaken } from './catalog-error';

describe('isNameTaken', () => {
  it('recognizes a repeated category name', () => {
    expect(isNameTaken({ status: 409, code: 'catalog.category_name_taken', detail: 'x' })).toBe(
      true,
    );
    expect(isNameTaken({ status: 409, code: 'catalog.category_not_empty', detail: 'x' })).toBe(
      false,
    );
  });
});

describe('isMenuOutdated', () => {
  it.each([
    'catalog.category_not_empty',
    'catalog.not_owner',
    'catalog.category_not_found',
    'catalog.product_not_found',
  ])('asks to load the menu again after %s', (code) => {
    expect(isMenuOutdated({ status: 409, code, detail: 'x' })).toBe(true);
  });

  it.each([
    ['a repeated name', 'catalog.category_name_taken'],
    ['a missing restaurant', 'restaurant.not_found'],
    ['a validation error', 'validation_failed'],
    ['no code', undefined],
  ])('keeps the menu after %s', (_case, code) => {
    expect(isMenuOutdated({ status: 400, code, detail: 'x' })).toBe(false);
  });
});

describe('describeCatalogError', () => {
  it.each([
    ['catalog.category_name_taken', 'Ya tienes una categoría con ese nombre.'],
    ['catalog.category_not_empty', 'todavía tiene productos'],
    ['catalog.not_owner', 'Tu menú cambió mientras lo editabas'],
    ['catalog.product_not_found', 'Tu menú cambió mientras lo editabas'],
    ['validation_failed', 'Revisa los datos marcados'],
    ['access_denied', 'no tiene permiso para editar un menú'],
    ['csrf_invalid', 'No pudimos validar tu solicitud'],
  ])('explains %s in Spanish', (code, message) => {
    expect(describeCatalogError({ status: 409, code, detail: 'Detalle del servidor' })).toContain(
      message,
    );
  });

  it('falls back to the detail of the server for an unknown code', () => {
    expect(describeCatalogError({ status: 500, detail: 'Detalle del servidor' })).toBe(
      'Detalle del servidor',
    );
  });
});
