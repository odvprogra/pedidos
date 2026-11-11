import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartRestaurant } from '@core/cart/cart';
import { CART_STORAGE_KEY, CartStore } from '@core/cart/cart-store';
import { Account } from './account';
import { SessionStore } from './session-store';

const ANA: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const LA_CASONA: CartRestaurant = { id: 4, name: 'La Casona', address: 'Calle Sucre 245' };
const SILPANCHO = { id: 10, name: 'Silpancho', price: 45 };

describe('SessionStore', () => {
  let store: SessionStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(SessionStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('load', () => {
    it('stays loading until the current account arrives', () => {
      store.load().subscribe();

      expect(store.status()).toBe('loading');
      expect(store.account()).toBeNull();

      httpTesting.expectOne('/api/v1/auth/me').flush(ANA);
    });

    it('starts the session with the account returned by the backend', () => {
      store.load().subscribe();

      httpTesting.expectOne('/api/v1/auth/me').flush(ANA);

      expect(store.status()).toBe('authenticated');
      expect(store.account()).toEqual(ANA);
    });

    it('leaves the visitor without a session when the backend answers 401', () => {
      let completed = false;
      store.load().subscribe({ complete: () => (completed = true) });

      httpTesting
        .expectOne('/api/v1/auth/me')
        .flush(
          { status: 401, code: 'unauthenticated' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(store.status()).toBe('anonymous');
      expect(completed).toBe(true);
    });

    it('leaves the visitor without a session when the backend is unreachable', () => {
      let completed = false;
      store.load().subscribe({ complete: () => (completed = true) });

      httpTesting.expectOne('/api/v1/auth/me').error(new ProgressEvent('error'));

      expect(store.status()).toBe('anonymous');
      expect(completed).toBe(true);
    });
  });

  it('starts a session with the given account', () => {
    store.signIn(ANA);

    expect(store.status()).toBe('authenticated');
    expect(store.account()).toEqual(ANA);
  });

  it('clears the session', () => {
    store.signIn(ANA);

    store.clear();

    expect(store.status()).toBe('anonymous');
    expect(store.account()).toBeNull();
  });

  it('keeps the cart when the session ends without logging out', () => {
    const cart = TestBed.inject(CartStore);
    store.signIn(ANA);
    cart.add(LA_CASONA, SILPANCHO);

    store.clear();

    expect(cart.count()).toBe(1);
  });

  describe('logOut', () => {
    beforeEach(() => store.signIn(ANA));

    it('closes the session in the backend and clears it', () => {
      store.logOut().subscribe();

      const request = httpTesting.expectOne('/api/v1/auth/logout');
      expect(request.request.method).toBe('POST');
      request.flush(null, { status: 204, statusText: 'No Content' });

      expect(store.status()).toBe('anonymous');
    });

    it('clears the session when the backend says it had already expired', () => {
      store.logOut().subscribe();

      httpTesting
        .expectOne('/api/v1/auth/logout')
        .flush(
          { status: 401, code: 'unauthenticated' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(store.status()).toBe('anonymous');
    });

    it('empties the cart once the session is closed', () => {
      const cart = TestBed.inject(CartStore);
      cart.add(LA_CASONA, SILPANCHO);

      store.logOut().subscribe();
      httpTesting
        .expectOne('/api/v1/auth/logout')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(cart.count()).toBe(0);
      expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    });

    it('keeps the cart when the session cannot be closed', () => {
      const cart = TestBed.inject(CartStore);
      cart.add(LA_CASONA, SILPANCHO);

      store.logOut().subscribe({ error: () => undefined });
      httpTesting
        .expectOne('/api/v1/auth/logout')
        .flush({ status: 500, detail: 'Error' }, { status: 500, statusText: 'Server Error' });

      expect(cart.count()).toBe(1);
    });

    it('keeps the session and reports the error when the backend fails', () => {
      let failed = false;
      store.logOut().subscribe({ error: () => (failed = true) });

      httpTesting
        .expectOne('/api/v1/auth/logout')
        .flush({ status: 500, detail: 'Error' }, { status: 500, statusText: 'Server Error' });

      expect(failed).toBe(true);
      expect(store.account()).toEqual(ANA);
    });
  });

  it('never writes the session to browser storage', () => {
    store.load().subscribe();
    httpTesting.expectOne('/api/v1/auth/me').flush(ANA);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
