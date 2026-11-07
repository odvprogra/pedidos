import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { appConfig } from './app.config';

const ANA: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const ME_URL = '/api/v1/auth/me';

describe('appConfig', () => {
  let initStatus: ApplicationInitStatus;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    initStatus = TestBed.inject(ApplicationInitStatus);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  async function startWith(account: Account | null): Promise<void> {
    const request = httpTesting.expectOne(ME_URL);
    if (account) {
      request.flush(account);
    } else {
      request.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });
    }
    await initStatus.donePromise;
  }

  it('waits for the current account before starting the app', async () => {
    expect(initStatus.done).toBe(false);

    await startWith(ANA);

    expect(initStatus.done).toBe(true);
    expect(TestBed.inject(SessionStore).account()).toEqual(ANA);
  });

  it('starts without a session when the backend cannot be reached', async () => {
    httpTesting.expectOne(ME_URL).error(new ProgressEvent('error'));
    await initStatus.donePromise;

    expect(TestBed.inject(SessionStore).status()).toBe('anonymous');
  });

  it('sends an account whose session expired back to log in', async () => {
    await startWith(ANA);

    TestBed.inject(HttpClient)
      .get('/api/v1/orders')
      .subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/v1/orders').flush({}, { status: 401, statusText: 'Unauthorized' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(TestBed.inject(Router).url).toBe('/ingresar?returnUrl=%2F&sessionExpired=true');
  });

  it('serves the log in and registration pages', async () => {
    await startWith(null);

    const harness = await RouterTestingHarness.create('/ingresar');
    expect(harness.routeNativeElement?.textContent).toContain('¡Hola de nuevo!');

    await harness.navigateByUrl('/registro');
    expect(harness.routeNativeElement?.textContent).toContain('Crea tu cuenta');
  });
});
