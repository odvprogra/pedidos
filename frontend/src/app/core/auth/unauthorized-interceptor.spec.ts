import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Account } from './account';
import { SessionStore } from './session-store';
import { unauthorizedInterceptor } from './unauthorized-interceptor';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankPage {}

const ANA: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };

describe('unauthorizedInterceptor', () => {
  let session: SessionStore;
  let router: Router;
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: BlankPage }]),
      ],
    });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/pedidos');
  });

  afterEach(() => httpTesting.verify());

  async function request(url: string, status: number): Promise<HttpErrorResponse | null> {
    let received: HttpErrorResponse | null = null;
    http.get(url).subscribe({ error: (error: HttpErrorResponse) => (received = error) });
    httpTesting.expectOne(url).flush({ status }, { status, statusText: 'Error' });
    await TestBed.inject(ApplicationRef).whenStable();
    return received;
  }

  it('clears an expired session and sends the account to log in again', async () => {
    session.signIn(ANA);

    const error = await request('/api/v1/orders', 401);

    expect(session.status()).toBe('anonymous');
    expect(router.url).toBe('/ingresar?returnUrl=%2Fpedidos&sessionExpired=true');
    expect(error?.status).toBe(401);
  });

  it('sends a visitor without a session to log in without saying a session expired', async () => {
    session.clear();

    await request('/api/v1/orders', 401);

    expect(router.url).toBe('/ingresar?returnUrl=%2Fpedidos');
  });

  it('keeps the first redirect when several requests get a 401 at once', async () => {
    session.signIn(ANA);
    http.get('/api/v1/orders').subscribe({ error: () => undefined });
    http.get('/api/v1/cart').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/v1/orders').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/api/v1/cart').flush({}, { status: 401, statusText: 'Unauthorized' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(router.url).toBe('/ingresar?returnUrl=%2Fpedidos&sessionExpired=true');
  });

  it('keeps the return url when a late 401 arrives on the log in page', async () => {
    session.signIn(ANA);
    await request('/api/v1/orders', 401);

    await request('/api/v1/cart', 401);

    expect(router.url).toBe('/ingresar?returnUrl=%2Fpedidos&sessionExpired=true');
  });

  it.each(['/api/v1/auth/me', '/api/v1/auth/login', '/api/v1/auth/logout'])(
    'leaves the 401 of %s to the caller',
    async (url) => {
      session.signIn(ANA);

      const error = await request(url, 401);

      expect(session.account()).toEqual(ANA);
      expect(router.url).toBe('/pedidos');
      expect(error?.status).toBe(401);
    },
  );

  it.each([403, 404, 500])('keeps the session when a request fails with %i', async (status) => {
    session.signIn(ANA);

    const error = await request('/api/v1/orders', status);

    expect(session.account()).toEqual(ANA);
    expect(router.url).toBe('/pedidos');
    expect(error?.status).toBe(status);
  });

  it('lets successful responses through untouched', () => {
    session.signIn(ANA);
    let body: unknown = null;

    http.get('/api/v1/orders').subscribe((response) => (body = response));
    httpTesting.expectOne('/api/v1/orders').flush([{ id: 1 }]);

    expect(body).toEqual([{ id: 1 }]);
    expect(session.account()).toEqual(ANA);
  });
});
