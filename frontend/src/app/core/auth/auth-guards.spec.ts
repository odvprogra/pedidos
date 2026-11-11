import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Account } from './account';
import { authGuard, guestGuard, roleGuard } from './auth-guards';
import { SessionStore } from './session-store';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankPage {}

const OWNER: Account = { id: 3, name: 'Luis Pérez', email: 'luis@correo.com', role: 'OWNER' };
const CUSTOMER: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const ADMIN: Account = { id: 1, name: 'Administrador', email: 'admin@pedidos.com', role: 'ADMIN' };

describe('auth guards', () => {
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'ingresar', component: BlankPage, canActivate: [guestGuard] },
          { path: 'pedidos', component: BlankPage, canActivate: [authGuard] },
          { path: 'mi-restaurante', component: BlankPage, canActivate: [roleGuard('OWNER')] },
          { path: 'admin', component: BlankPage, canActivate: [roleGuard('ADMIN')] },
        ]),
      ],
    });
    session = TestBed.inject(SessionStore);
  });

  async function visit(url: string): Promise<string> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  describe('authGuard', () => {
    it('sends a visitor without a session to log in, remembering where they were going', async () => {
      session.clear();

      expect(await visit('/pedidos?vista=detalle')).toBe(
        '/ingresar?returnUrl=%2Fpedidos%3Fvista%3Ddetalle',
      );
    });

    it('lets an account with a session through', async () => {
      session.signIn(CUSTOMER);

      expect(await visit('/pedidos')).toBe('/pedidos');
    });
  });

  describe('roleGuard', () => {
    it('sends a visitor without a session to log in', async () => {
      session.clear();

      expect(await visit('/mi-restaurante')).toBe('/ingresar?returnUrl=%2Fmi-restaurante');
    });

    it('lets an account with the required role through', async () => {
      session.signIn(OWNER);

      expect(await visit('/mi-restaurante')).toBe('/mi-restaurante');
    });

    it('sends an account with another role to the home page', async () => {
      session.signIn(CUSTOMER);

      expect(await visit('/mi-restaurante')).toBe('/');
    });

    it('sends an admin to its panel from a page of another role', async () => {
      session.signIn(ADMIN);

      expect(await visit('/mi-restaurante')).toBe('/admin');
    });
  });

  describe('guestGuard', () => {
    it('lets a visitor without a session open the log in page', async () => {
      session.clear();

      expect(await visit('/ingresar')).toBe('/ingresar');
    });

    it('sends an account with a session to the home page', async () => {
      session.signIn(CUSTOMER);

      expect(await visit('/ingresar')).toBe('/');
    });

    it('sends an admin with a session to its panel', async () => {
      session.signIn(ADMIN);

      expect(await visit('/ingresar')).toBe('/admin');
    });
  });
});
