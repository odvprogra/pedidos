import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { Header } from './header';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankPage {}

const ANA: Account = { id: 7, name: 'Ana María Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const ADMIN: Account = { id: 1, name: 'Administrador', email: 'admin@pedidos.com', role: 'ADMIN' };
const OWNER: Account = { id: 3, name: 'Luis Pérez', email: 'luis@correo.com', role: 'OWNER' };
const LOGOUT_URL = '/api/v1/auth/logout';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let session: SessionStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: BlankPage }]),
      ],
    });
    session = TestBed.inject(SessionStore);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Header);
  });

  afterEach(() => httpTesting.verify());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function logOutButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  async function logOutFrom(url: string): Promise<void> {
    session.signIn(ANA);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    logOutButton().click();
    await fixture.whenStable();
  }

  it('shows neither the account links nor the account while the session loads', async () => {
    await fixture.whenStable();

    expect(text()).not.toContain('Ingresar');
    expect(text()).not.toContain('Cerrar sesión');
  });

  it('invites a visitor without a session to log in or create an account', async () => {
    session.clear();
    await fixture.whenStable();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a') as NodeListOf<HTMLAnchorElement>,
      (link) => [link.textContent?.trim(), link.getAttribute('href')],
    );
    expect(links).toEqual([
      ['Ingresar', '/ingresar'],
      ['Crear cuenta', '/registro'],
    ]);
  });

  it('shows the first name and role of the account with a session', async () => {
    session.signIn(ANA);
    await fixture.whenStable();

    expect(text()).toContain('Ana');
    expect(text()).not.toContain('Rojas');
    expect(text()).toContain('Cliente');
    expect(logOutButton().textContent).toContain('Cerrar sesión');
  });

  it('gives an admin a link to the panel', async () => {
    session.signIn(ADMIN);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a[href="/admin"]') as HTMLAnchorElement;
    expect(link.textContent?.replace(/\s+/g, ' ').trim()).toBe('Panel de administración');
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(text()).toContain('Administrador');
  });

  it('marks the panel link while the admin is in the panel', async () => {
    session.signIn(ADMIN);
    await TestBed.inject(Router).navigateByUrl('/admin');
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a[href="/admin"]') as HTMLAnchorElement;
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it.each([
    ['a customer', ANA],
    ['an owner', OWNER],
  ])('does not show the panel link to %s', async (_case, account) => {
    session.signIn(account);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href="/admin"]')).toBeNull();
  });

  it('gives an owner a link to its restaurant', async () => {
    session.signIn(OWNER);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector(
      'a[href="/mi-restaurante"]',
    ) as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Mi restaurante');
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(text()).toContain('Dueño de restaurante');
  });

  it('marks the restaurant link while the owner is in its restaurant', async () => {
    session.signIn(OWNER);
    await TestBed.inject(Router).navigateByUrl('/mi-restaurante');
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector(
      'a[href="/mi-restaurante"]',
    ) as HTMLAnchorElement;
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it.each([
    ['a customer', ANA],
    ['an admin', ADMIN],
  ])('does not show the restaurant link to %s', async (_case, account) => {
    session.signIn(account);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href="/mi-restaurante"]')).toBeNull();
  });

  it('disables the button while the session is closing', async () => {
    await logOutFrom('/pedidos');

    expect(logOutButton().getAttribute('aria-disabled')).toBe('true');
    expect(logOutButton().textContent).toContain('Cerrando sesión…');
    httpTesting.expectOne(LOGOUT_URL).flush(null, { status: 204, statusText: 'No Content' });
  });

  it.each([
    [204, 'No Content'],
    [401, 'Unauthorized'],
  ])('closes the session and goes home when the backend answers %i', async (status, statusText) => {
    await logOutFrom('/pedidos');

    const request = httpTesting.expectOne(LOGOUT_URL);
    expect(request.request.method).toBe('POST');
    request.flush(null, { status, statusText });
    await fixture.whenStable();

    expect(session.account()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(text()).toContain('Ingresar');
  });

  it('keeps the session and says so when the session cannot be closed', async () => {
    await logOutFrom('/pedidos');

    httpTesting
      .expectOne(LOGOUT_URL)
      .flush({ status: 500, detail: 'Error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(session.account()).toEqual(ANA);
    expect(TestBed.inject(Router).url).toBe('/pedidos');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cerrar la sesión',
    );
    expect(logOutButton().getAttribute('aria-disabled')).toBe('false');
  });
});
