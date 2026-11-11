import { ProblemDetails } from '@core/http/problem-details';

const NAME_TAKEN = 'catalog.category_name_taken';
const NOT_EMPTY = 'catalog.category_not_empty';
const OUTDATED = 'Tu menú cambió mientras lo editabas. Te mostramos cómo está ahora.';

const MESSAGES = new Map<string, string>([
  [NAME_TAKEN, 'Ya tienes una categoría con ese nombre.'],
  [NOT_EMPTY, 'No pudimos borrar la categoría: todavía tiene productos.'],
  ['catalog.not_owner', OUTDATED],
  ['catalog.category_not_found', OUTDATED],
  ['catalog.product_not_found', OUTDATED],
  ['validation_failed', 'Revisa los datos marcados e intenta de nuevo.'],
  ['access_denied', 'Tu cuenta no tiene permiso para editar un menú.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

const STALE_MENU = new Set([
  NOT_EMPTY,
  'catalog.not_owner',
  'catalog.category_not_found',
  'catalog.product_not_found',
]);

export function isNameTaken(problem: ProblemDetails): boolean {
  return problem.code === NAME_TAKEN;
}

export function isMenuOutdated(problem: ProblemDetails): boolean {
  return STALE_MENU.has(problem.code ?? '');
}

export function describeCatalogError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
