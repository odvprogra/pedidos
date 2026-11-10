import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { Page } from '@core/http/page';
import { AccountSummary } from '../../models/account-summary';
import { AccountListPage } from './account-list-page';

const ADMIN: Account = {
  id: 1,
  name: 'Administrador',
  email: 'admin@pedidos.com',
  role: 'ADMIN',
};
const ADMIN_ROW: AccountSummary = { ...ADMIN, suspended: false };
const ANA: AccountSummary = {
  id: 7,
  name: 'Ana Rojas',
  email: 'ana@correo.com',
  role: 'CUSTOMER',
  suspended: false,
};
const LUIS: AccountSummary = {
  id: 9,
  name: 'Luis Pérez',
  email: 'luis@correo.com',
  role: 'OWNER',
  suspended: true,
};
const FIRST_PAGE_URL = '/api/v1/accounts?page=0&size=20';

function pageOf(
  items: AccountSummary[],
  page = 0,
  totalItems = items.length,
): Page<AccountSummary> {
  return { items, page, size: 20, totalItems, totalPages: Math.ceil(totalItems / 20) };
}

describe('AccountListPage', () => {
  let fixture: ComponentFixture<AccountListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(SessionStore).signIn(ADMIN);
    fixture = TestBed.createComponent(AccountListPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function rows(): HTMLLIElement[] {
    return Array.from(page().querySelectorAll('ul > li'));
  }

  function rowOf(name: string): HTMLLIElement {
    const row = rows().find((candidate) => candidate.textContent?.includes(name));
    if (!row) {
      throw new Error(`No row shows ${name}`);
    }
    return row;
  }

  function buttonIn(container: HTMLElement, label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!button) {
      throw new Error(`No button says ${label}`);
    }
    return button;
  }

  async function show(result: Page<AccountSummary>): Promise<void> {
    httpTesting.expectOne(FIRST_PAGE_URL).flush(result);
    await fixture.whenStable();
  }

  async function confirm(name: string, action: string, confirmation: string): Promise<void> {
    buttonIn(rowOf(name), action).click();
    await fixture.whenStable();
    buttonIn(rowOf(name), confirmation).click();
    await fixture.whenStable();
  }

  function failWith(url: string, status: number, code?: string): void {
    httpTesting
      .expectOne(url)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
  }

  describe('the list', () => {
    it('shows a placeholder while the first page loads', async () => {
      expect(page().querySelector('[role="status"]')?.textContent).toContain('Cargando cuentas');

      await show(pageOf([ANA]));

      expect(page().querySelector('[role="status"]')).toBeNull();
    });

    it('shows each account with its email, role and status in Spanish', async () => {
      await show(pageOf([ADMIN_ROW, ANA, LUIS]));

      expect(rows()).toHaveLength(3);
      expect(rowOf('Ana Rojas').textContent).toContain('ana@correo.com');
      expect(rowOf('Ana Rojas').textContent).toContain('Cliente');
      expect(rowOf('Ana Rojas').querySelector('[data-status]')?.textContent).toContain('Activa');
      expect(rowOf('Luis Pérez').textContent).toContain('Dueño de restaurante');
      expect(rowOf('Luis Pérez').querySelector('[data-status]')?.textContent).toContain(
        'Suspendida',
      );
      expect(text()).toContain('3 cuentas');
    });

    it('offers to suspend an active account and to reactivate a suspended one', async () => {
      await show(pageOf([ANA, LUIS]));

      expect(rowOf('Ana Rojas').querySelector('button')?.textContent).toContain('Suspender');
      expect(rowOf('Luis Pérez').querySelector('button')?.textContent).toContain('Reactivar');
    });

    it('marks the own account and shows no action for an admin', async () => {
      await show(pageOf([ADMIN_ROW, ANA]));

      expect(rowOf('Administrador').textContent).toContain('Tú');
      expect(rowOf('Administrador').textContent).toContain('Protegida');
      expect(rowOf('Administrador').querySelector('button')).toBeNull();
      expect(rowOf('Ana Rojas').textContent).not.toContain('Tú');
    });

    it('explains that there are no accounts yet', async () => {
      await show(pageOf([]));

      expect(rows()).toHaveLength(0);
      expect(text()).toContain('Todavía no hay cuentas');
    });

    it('explains that the list could not load and loads it again', async () => {
      failWith(FIRST_PAGE_URL, 500);
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');

      buttonIn(page(), 'Reintentar').click();
      await show(pageOf([ANA]));

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(rows()).toHaveLength(1);
    });

    it('explains that the server cannot be reached', async () => {
      httpTesting.expectOne(FIRST_PAGE_URL).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });
  });

  describe('the pages', () => {
    it('hides the pages when everything fits in one', async () => {
      await show(pageOf([ANA, LUIS]));

      expect(page().querySelector('nav[aria-label="Paginación"]')).toBeNull();
    });

    it('asks for the next page and keeps the current one visible meanwhile', async () => {
      await show(pageOf([ANA], 0, 45));
      expect(text()).toContain('Página 1 de 3');

      buttonIn(page(), 'Siguiente').click();
      await fixture.whenStable();

      const list = page().querySelector('[aria-busy]');
      expect(list?.getAttribute('aria-busy')).toBe('true');
      expect(rowOf('Ana Rojas')).toBeTruthy();
      httpTesting.expectOne('/api/v1/accounts?page=1&size=20').flush(pageOf([LUIS], 1, 45));
      await fixture.whenStable();

      expect(text()).toContain('Página 2 de 3');
      expect(rows().map((row) => row.textContent)).toEqual([expect.stringContaining('Luis Pérez')]);
      expect(list?.getAttribute('aria-busy')).toBe('false');
    });

    it('takes the focus to the top of the list once the new page arrives', async () => {
      await show(pageOf([ANA], 0, 45));

      buttonIn(page(), 'Siguiente').click();
      httpTesting.expectOne('/api/v1/accounts?page=1&size=20').flush(pageOf([LUIS], 1, 45));
      await fixture.whenStable();

      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('takes the focus to retry when the new page fails', async () => {
      await show(pageOf([ANA], 0, 45));

      buttonIn(page(), 'Siguiente').click();
      failWith('/api/v1/accounts?page=1&size=20', 500);
      await fixture.whenStable();

      expect(document.activeElement).toBe(buttonIn(page(), 'Reintentar'));
    });

    it('loads the same page again when it failed', async () => {
      await show(pageOf([ANA], 0, 45));
      buttonIn(page(), 'Siguiente').click();
      failWith('/api/v1/accounts?page=1&size=20', 500);
      await fixture.whenStable();

      buttonIn(page(), 'Reintentar').click();

      httpTesting.expectOne('/api/v1/accounts?page=1&size=20').flush(pageOf([LUIS], 1, 45));
      await fixture.whenStable();
      expect(rowOf('Luis Pérez')).toBeTruthy();
    });

    it('does not ask for another page while one is loading', async () => {
      await show(pageOf([ANA], 0, 45));

      buttonIn(page(), 'Siguiente').click();
      await fixture.whenStable();
      buttonIn(page(), 'Siguiente').click();

      httpTesting.expectOne('/api/v1/accounts?page=1&size=20').flush(pageOf([LUIS], 1, 45));
    });
  });

  describe('the actions', () => {
    it('asks before suspending and sends nothing when the admin cancels', async () => {
      await show(pageOf([ANA]));

      buttonIn(rowOf('Ana Rojas'), 'Suspender').click();
      await fixture.whenStable();

      expect(rowOf('Ana Rojas').textContent).toContain('¿Suspender la cuenta de Ana Rojas?');
      expect(rowOf('Ana Rojas').textContent).toContain('se cerrarán sus sesiones');

      buttonIn(rowOf('Ana Rojas'), 'Cancelar').click();
      await fixture.whenStable();

      expect(rowOf('Ana Rojas').textContent).not.toContain('¿Suspender');
      httpTesting.expectNone('/api/v1/accounts/7/suspend');
    });

    it('suspends the account once the admin confirms', async () => {
      await show(pageOf([ANA]));

      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');

      const request = httpTesting.expectOne('/api/v1/accounts/7/suspend');
      expect(request.request.method).toBe('POST');
      expect(rowOf('Ana Rojas').querySelector('button')?.textContent).toContain('Suspendiendo…');
      expect(rowOf('Ana Rojas').querySelector('button')?.getAttribute('aria-disabled')).toBe(
        'true',
      );
      request.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(rowOf('Ana Rojas').querySelector('[data-status]')?.textContent).toContain(
        'Suspendida',
      );
      expect(rowOf('Ana Rojas').querySelector('button')?.textContent).toContain('Reactivar');
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Suspendiste la cuenta de Ana Rojas.',
      );
    });

    it('reactivates a suspended account once the admin confirms', async () => {
      await show(pageOf([LUIS]));

      await confirm('Luis Pérez', 'Reactivar', 'Sí, reactivar');
      httpTesting
        .expectOne('/api/v1/accounts/9/reactivate')
        .flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(rowOf('Luis Pérez').querySelector('[data-status]')?.textContent).toContain('Activa');
      expect(rowOf('Luis Pérez').querySelector('button')?.textContent).toContain('Suspender');
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Reactivaste la cuenta de Luis Pérez.',
      );
    });

    it('sends a single request when the admin insists', async () => {
      await show(pageOf([ANA]));

      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      buttonIn(rowOf('Ana Rojas'), 'Suspendiendo…').click();
      await fixture.whenStable();

      expect(rowOf('Ana Rojas').textContent).not.toContain('¿Suspender');
      httpTesting
        .expectOne('/api/v1/accounts/7/suspend')
        .flush(null, { status: 204, statusText: 'No Content' });
    });

    it('keeps the other accounts waiting while an action runs', async () => {
      await show(pageOf([ANA, LUIS]));

      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      const otherButton = buttonIn(rowOf('Luis Pérez'), 'Reactivar');
      otherButton.click();
      await fixture.whenStable();

      expect(otherButton.getAttribute('aria-disabled')).toBe('true');
      expect(rowOf('Luis Pérez').textContent).not.toContain('¿Reactivar');
      httpTesting
        .expectOne('/api/v1/accounts/7/suspend')
        .flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();
      expect(otherButton.getAttribute('aria-disabled')).toBe('false');
    });

    it.each([
      [
        422,
        'identity.admin_not_suspendable',
        'Las cuentas de administrador no se pueden suspender.',
      ],
      [404, 'identity.not_found', 'No encontramos esa cuenta.'],
      [403, 'access_denied', 'Tu cuenta no tiene permiso para administrar cuentas.'],
      [403, 'csrf_invalid', 'No pudimos validar tu solicitud.'],
      [500, undefined, 'Detalle del servidor'],
    ])(
      'explains a %i %s answer and leaves the account as it was',
      async (status, code, message) => {
        await show(pageOf([ANA]));

        await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
        failWith('/api/v1/accounts/7/suspend', status, code);
        await fixture.whenStable();

        expect(page().querySelector('[role="alert"]')?.textContent).toContain(message);
        expect(rowOf('Ana Rojas').querySelector('[data-status]')?.textContent).toContain('Activa');
        expect(buttonIn(rowOf('Ana Rojas'), 'Suspender').getAttribute('aria-disabled')).toBe(
          'false',
        );
      },
    );

    it('lets the admin close the message', async () => {
      await show(pageOf([ANA]));
      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      httpTesting
        .expectOne('/api/v1/accounts/7/suspend')
        .flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      (page().querySelector('button[aria-label="Cerrar aviso"]') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(page().querySelector('[role="status"]')).toBeNull();
    });

    it('announces the same failure again as a new notice', async () => {
      await show(pageOf([ANA]));
      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      failWith('/api/v1/accounts/7/suspend', 403, 'csrf_invalid');
      await fixture.whenStable();
      const first = page().querySelector('app-alert[dismissible]');

      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      failWith('/api/v1/accounts/7/suspend', 403, 'csrf_invalid');
      await fixture.whenStable();

      const second = page().querySelector('app-alert[dismissible]');
      expect(second?.textContent).toContain('No pudimos validar tu solicitud.');
      expect(second).not.toBe(first);
    });

    it('clears the previous message when another action starts', async () => {
      await show(pageOf([ANA, LUIS]));
      await confirm('Ana Rojas', 'Suspender', 'Sí, suspender');
      failWith('/api/v1/accounts/7/suspend', 403, 'csrf_invalid');
      await fixture.whenStable();

      await confirm('Luis Pérez', 'Reactivar', 'Sí, reactivar');

      expect(page().querySelector('[role="alert"]')).toBeNull();
      httpTesting
        .expectOne('/api/v1/accounts/9/reactivate')
        .flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
