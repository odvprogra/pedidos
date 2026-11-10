import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { LogInPage } from './log-in-page';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankPage {}

const ANA: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const ADMIN: Account = { id: 1, name: 'Administrador', email: 'admin@pedidos.com', role: 'ADMIN' };
const LOGIN_URL = '/api/v1/auth/login';

describe('LogInPage', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'ingresar', component: LogInPage },
            { path: 'bloqueada', component: BlankPage, canActivate: [() => false] },
            { path: '**', component: BlankPage },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  async function open(url = '/ingresar'): Promise<void> {
    harness = await RouterTestingHarness.create(url);
  }

  async function waitForTheNavigationToSettle(): Promise<void> {
    await harness.fixture.whenStable();
    await harness.fixture.whenStable();
  }

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function submitButton(): HTMLButtonElement {
    return page().querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function fill(id: string, value: string): void {
    const input = page().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submitCredentials(): Promise<void> {
    fill('email', 'ana@correo.com');
    fill('password', 'secreta123');
    submitButton().click();
    await harness.fixture.whenStable();
  }

  function failWith(status: number, code?: string): void {
    httpTesting
      .expectOne(LOGIN_URL)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
  }

  it('starts with an empty form ready to log in', async () => {
    await open();

    expect((page().querySelector('#email') as HTMLInputElement).value).toBe('');
    expect((page().querySelector('#password') as HTMLInputElement).value).toBe('');
    expect(submitButton().textContent?.trim()).toBe('Ingresar');
    expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    expect(page().querySelector('[role="alert"]')).toBeNull();
  });

  it('asks for the missing fields without calling the API', async () => {
    await open();

    submitButton().click();
    await harness.fixture.whenStable();

    httpTesting.expectNone(LOGIN_URL);
    expect(page().textContent).toContain('Escribe tu correo.');
    expect(page().textContent).toContain('Escribe tu contraseña.');
    expect(page().querySelector('#email')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('sends the credentials once and shows that it is working', async () => {
    await open();

    await submitCredentials();
    submitButton().click();

    const request = httpTesting.expectOne(LOGIN_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@correo.com', password: 'secreta123' });
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    expect(submitButton().textContent).toContain('Ingresando…');
    request.flush(ANA);
  });

  it('starts the session and goes back to where the account was going', async () => {
    await open('/ingresar?returnUrl=%2Fpedidos%2F12');

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).flush(ANA);
    await harness.fixture.whenStable();

    expect(TestBed.inject(SessionStore).account()).toEqual(ANA);
    expect(TestBed.inject(Router).url).toBe('/pedidos/12');
  });

  it('lets the account try again when it cannot leave the page', async () => {
    await open('/ingresar?returnUrl=%2Fbloqueada');

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).flush(ANA);
    await waitForTheNavigationToSettle();

    expect(TestBed.inject(Router).url).toBe('/ingresar?returnUrl=%2Fbloqueada');
    expect(submitButton().getAttribute('aria-disabled')).toBe('false');
  });

  it('goes to the home page when the return url leaves the site', async () => {
    await open('/ingresar?returnUrl=https%3A%2F%2Fotro-sitio.com');

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).flush(ANA);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('takes an admin to the panel when there is nowhere else to go', async () => {
    await open();

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).flush(ADMIN);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('takes an admin back to where it was going', async () => {
    await open('/ingresar?returnUrl=%2Fpedidos%2F12');

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).flush(ADMIN);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/pedidos/12');
  });

  it.each([
    [401, 'identity.invalid_credentials', 'El correo o la contraseña no coinciden'],
    [403, 'identity.account_suspended', 'Tu cuenta está suspendida'],
    [403, 'csrf_invalid', 'No pudimos validar tu solicitud'],
    [500, undefined, 'Detalle del servidor'],
  ])('explains a %i %s response and lets the account try again', async (status, code, message) => {
    await open();

    await submitCredentials();
    failWith(status, code);
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(message);
    expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    expect(TestBed.inject(SessionStore).account()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/ingresar');
  });

  it('explains that the server cannot be reached', async () => {
    await open();

    await submitCredentials();
    httpTesting.expectOne(LOGIN_URL).error(new ProgressEvent('error'));
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
  });

  it('warns that the session ended when the account was sent back to log in', async () => {
    await open('/ingresar?returnUrl=%2Fpedidos&sessionExpired=true');

    expect(page().querySelector('[role="alert"]')?.textContent).toContain('Tu sesión terminó');
  });

  it('does not talk about an ended session on a normal visit', async () => {
    await open();

    expect(page().textContent).not.toContain('Tu sesión terminó');
  });

  it('hides the ended session notice once the account tries to log in', async () => {
    await open('/ingresar?sessionExpired=true');

    submitButton().click();
    await harness.fixture.whenStable();

    expect(page().textContent).not.toContain('Tu sesión terminó');
  });

  it('moves the focus to the first field with a problem', async () => {
    await open();
    fill('email', 'ana@correo.com');

    submitButton().click();
    await harness.fixture.whenStable();

    expect(document.activeElement?.id).toBe('password');
  });

  it('keeps the return url in the link to create an account', async () => {
    await open('/ingresar?returnUrl=%2Fpedidos');

    const link = page().querySelector('a[href^="/registro"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/registro?returnUrl=%2Fpedidos');
  });

  it('cancels the log in when the person leaves before it answers', async () => {
    await open();
    await submitCredentials();
    const request = httpTesting.expectOne(LOGIN_URL);

    await harness.navigateByUrl('/restaurantes');

    expect(request.cancelled).toBe(true);
  });
});
