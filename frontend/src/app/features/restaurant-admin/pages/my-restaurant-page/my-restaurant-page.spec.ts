import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Announcer } from '@shared/ui/live-region/announcer';
import { Catalog } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import { MyRestaurantPage } from './my-restaurant-page';

const MINE_URL = '/api/v1/restaurants/mine';
const REGISTER_URL = '/api/v1/restaurants';
const OPEN_URL = '/api/v1/restaurants/mine/open';
const CLOSE_URL = '/api/v1/restaurants/mine/close';
const MENU_URL = '/api/v1/restaurants/mine/catalog';
const MENU: Catalog = {
  categories: [
    {
      id: 3,
      name: 'Platos fuertes',
      products: [
        {
          id: 10,
          categoryId: 3,
          name: 'Silpancho',
          description: null,
          price: 45,
          available: true,
          imageUrl: null,
        },
      ],
    },
  ],
};
const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: false,
  suspended: false,
  category: 'TRADITIONAL',
  imageUrl: null,
};

describe('MyRestaurantPage', () => {
  let fixture: ComponentFixture<MyRestaurantPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyRestaurantPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function heading(): HTMLElement {
    return page().querySelector('h1') as HTMLElement;
  }

  function field(id: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return page().querySelector(`#${id}`) as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  }

  function messageOf(id: string): string {
    return page().querySelector(`#${id}-message`)?.textContent?.trim() ?? '';
  }

  function submitButton(): HTMLButtonElement {
    return page().querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function toggle(): HTMLButtonElement {
    return page().querySelector('button[role="switch"]') as HTMLButtonElement;
  }

  function status(): string {
    return page().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  function notice(): string {
    return page().querySelector('app-alert[dismissible]')?.textContent?.trim() ?? '';
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(page().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  function fill(id: string, value: string): void {
    const control = field(id);
    control.value = value;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
    control.dispatchEvent(new Event('blur'));
  }

  function failWith(url: string, status: number, code?: string, extra: object = {}): void {
    httpTesting
      .expectOne(url)
      .flush(
        { status, detail: 'Detalle del servidor', code, ...extra },
        { status, statusText: 'Error' },
      );
  }

  async function showMissing(): Promise<void> {
    failWith(MINE_URL, 404, 'restaurant.not_found');
    await fixture.whenStable();
  }

  async function showRestaurant(changes: Partial<Restaurant> = {}): Promise<void> {
    httpTesting.expectOne(MINE_URL).flush({ ...LA_CASONA, ...changes });
    await fixture.whenStable();
    httpTesting.expectOne(MENU_URL).flush(MENU);
    await fixture.whenStable();
  }

  function menuSummary(): string {
    return page().querySelector('[data-menu-summary]')?.textContent?.trim() ?? '';
  }

  async function submitValidForm(): Promise<void> {
    fill('name', 'La Casona');
    fill('category', 'TRADITIONAL');
    fill('description', 'Comida criolla casera');
    fill('address', 'Calle Sucre 245');
    submitButton().click();
    await fixture.whenStable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the restaurant loads', async () => {
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando tu restaurante…']);

      await showRestaurant();

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows the restaurant of the owner', async () => {
      await showRestaurant();

      expect(heading().textContent).toContain('Mi restaurante');
      expect(page().querySelector('h2')?.textContent).toContain('La Casona');
      expect(text()).toContain('Calle Sucre 245');
      expect(status()).toBe('Cerrado');
      expect(page().querySelector('form')).toBeNull();
    });

    it('offers the registration form when the owner has no restaurant yet', async () => {
      await showMissing();

      expect(heading().textContent).toContain('Registra tu restaurante');
      expect(text()).toContain('Cómo funciona');
      expect(text()).toContain('Empieza cerrado');
      expect(field('name').value).toBe('');
      expect(submitButton().textContent?.trim()).toBe('Registrar restaurante');
      expect(page().querySelector('[role="alert"]')).toBeNull();
    });

    it('explains that the restaurant could not load and loads it again', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu restaurante',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');
      expect(page().querySelector('form')).toBeNull();

      button('Reintentar').click();
      await showRestaurant();

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(page().querySelector('h2')?.textContent).toContain('La Casona');
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();
      const retry = button('Reintentar');
      retry.focus();

      retry.click();
      await fixture.whenStable();
      retry.click();

      expect(page().querySelector('app-load-error')?.textContent).toContain(
        'No pudimos cargar tu restaurante',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await showRestaurant();

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(document.activeElement).toBe(heading());
    });

    it('offers the registration when the retry finds no restaurant', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      button('Reintentar').click();
      await showMissing();

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(page().querySelector('form')).toBeTruthy();
      expect(document.activeElement).toBe(heading());
    });

    it('does not take a not found without its code for a missing restaurant', async () => {
      failWith(MINE_URL, 404);
      await fixture.whenStable();

      expect(page().querySelector('form')).toBeNull();
      expect(button('Reintentar')).toBeTruthy();
    });

    it('explains that the server cannot be reached', async () => {
      httpTesting.expectOne(MINE_URL).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });

    it('takes the focus to retry when loading again fails', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      button('Reintentar').click();
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      expect(document.activeElement).toBe(button('Reintentar'));
    });
  });

  describe('the registration', () => {
    beforeEach(showMissing);

    it('asks for the missing fields without calling the API', async () => {
      submitButton().click();
      await fixture.whenStable();

      httpTesting.expectNone(REGISTER_URL);
      expect(messageOf('name')).toBe('Escribe el nombre de tu restaurante.');
      expect(messageOf('address')).toBe('Escribe dónde queda tu restaurante.');
      expect(messageOf('description')).toBe('Cuéntales qué cocinas, en hasta 300 caracteres.');
      expect(document.activeElement?.id).toBe('name');
    });

    it.each([
      ['name', '   ', 'Escribe el nombre de tu restaurante.'],
      ['name', 'a'.repeat(121), 'Usa hasta 120 caracteres.'],
      ['description', 'a'.repeat(301), 'Usa hasta 300 caracteres.'],
      ['address', '   ', 'Escribe dónde queda tu restaurante.'],
      ['address', 'a'.repeat(201), 'Usa hasta 200 caracteres.'],
    ])('explains why the %s field is not valid', async (id, value, message) => {
      fill(id, value);
      await fixture.whenStable();

      expect(messageOf(id)).toBe(message);
      expect(field(id).getAttribute('aria-invalid')).toBe('true');
    });

    it.each([
      ['name', 'a'.repeat(120)],
      ['description', 'a'.repeat(300)],
      ['address', 'a'.repeat(200)],
    ])('accepts the %s field at its limit', async (id, value) => {
      fill(id, value);
      await fixture.whenStable();

      expect(field(id).getAttribute('aria-invalid')).toBe('false');
    });

    it('counts the characters of the description as the owner types', async () => {
      const counter = (): string =>
        page().querySelector('#description + [aria-hidden="true"]')?.textContent?.trim() ?? '';
      expect(counter()).toBe('0/300');

      fill('description', 'Comida criolla');
      await fixture.whenStable();

      expect(counter()).toBe('14/300');
    });

    it('sends the registration once and shows that it is working', async () => {
      await submitValidForm();
      submitButton().click();

      const request = httpTesting.expectOne(REGISTER_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        name: 'La Casona',
        description: 'Comida criolla casera',
        address: 'Calle Sucre 245',
        category: 'TRADITIONAL',
        imageUrl: '',
      });
      expect(submitButton().getAttribute('aria-disabled')).toBe('true');
      expect(submitButton().textContent).toContain('Registrando…');
      request.flush(LA_CASONA, { status: 201, statusText: 'Created' });
    });

    it('sends an empty description when the owner leaves it out', async () => {
      fill('name', 'La Casona');
      fill('category', 'TRADITIONAL');
      fill('address', 'Calle Sucre 245');
      submitButton().click();
      await fixture.whenStable();

      const request = httpTesting.expectOne(REGISTER_URL);
      expect(request.request.body).toEqual({
        name: 'La Casona',
        description: '',
        address: 'Calle Sucre 245',
        category: 'TRADITIONAL',
        imageUrl: '',
      });
      request.flush({ ...LA_CASONA, description: null }, { status: 201, statusText: 'Created' });
    });

    it('shows the new restaurant closed and celebrates it', async () => {
      await submitValidForm();
      httpTesting.expectOne(REGISTER_URL).flush(LA_CASONA, { status: 201, statusText: 'Created' });
      await fixture.whenStable();

      expect(page().querySelector('form')).toBeNull();
      expect(heading().textContent).toContain('Mi restaurante');
      expect(page().querySelector('h2')?.textContent).toContain('La Casona');
      expect(status()).toBe('Cerrado');
      expect(announced()).toEqual([
        '¡Listo! Registraste La Casona. Está cerrado: ábrelo cuando quieras recibir pedidos.',
      ]);
      expect(document.activeElement).toBe(heading());
    });

    it('offers the categories of the list, with none chosen at first', async () => {
      const options = Array.from((field('category') as HTMLSelectElement).options, (option) =>
        option.textContent?.trim(),
      );

      expect(options).toEqual([
        'Elige una opción',
        'Comida típica',
        'Parrillas',
        'Pollos',
        'Pizzas',
        'Hamburguesas',
        'Sushi',
        'Cafeterías',
        'Otros',
      ]);
      expect(field('category').value).toBe('');
    });

    it('asks for the category before registering', async () => {
      fill('name', 'La Casona');
      fill('address', 'Calle Sucre 245');

      submitButton().click();
      await fixture.whenStable();

      expect(messageOf('category')).toBe('Elige qué tipo de comida ofreces.');
      expect(document.activeElement?.id).toBe('category');
      httpTesting.expectNone(REGISTER_URL);
    });

    it.each([
      ['logo.png', 'Pega una dirección que empiece con http:// o https://.'],
      [
        'ftp://fotos.pedidos.test/logo.png',
        'Pega una dirección que empiece con http:// o https://.',
      ],
      [`https://fotos.pedidos.test/${'a'.repeat(480)}`, 'Usa hasta 500 caracteres.'],
    ])('explains why the image %s is not valid', async (value, message) => {
      fill('imageUrl', value);
      await fixture.whenStable();

      expect(messageOf('imageUrl')).toBe(message);
      expect(field('imageUrl').getAttribute('aria-invalid')).toBe('true');
    });

    it('sends the category and the image of the restaurant', async () => {
      fill('name', 'Sushi Ito');
      fill('category', 'SUSHI');
      fill('address', 'Av. Banzer 120');
      fill('imageUrl', 'https://fotos.pedidos.test/ito.png');
      submitButton().click();
      await fixture.whenStable();

      const request = httpTesting.expectOne(REGISTER_URL);
      expect(request.request.body).toEqual({
        name: 'Sushi Ito',
        description: '',
        address: 'Av. Banzer 120',
        category: 'SUSHI',
        imageUrl: 'https://fotos.pedidos.test/ito.png',
      });
      request.flush(
        { ...LA_CASONA, name: 'Sushi Ito', category: 'SUSHI' },
        { status: 201, statusText: 'Created' },
      );
    });

    it('marks the fields rejected by the backend validation', async () => {
      await submitValidForm();
      failWith(REGISTER_URL, 400, 'validation_failed', {
        errors: [{ field: 'address', message: 'no debe estar vacío' }],
      });
      await fixture.whenStable();

      expect(messageOf('address')).toBe('no debe estar vacío');
      expect(document.activeElement?.id).toBe('address');
      expect(page().querySelector('form [role="alert"]')?.textContent).toContain(
        'Revisa los datos marcados',
      );
      expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    });

    it('shows the restaurant registered meanwhile in another tab', async () => {
      await submitValidForm();
      failWith(REGISTER_URL, 409, 'restaurant.already_registered');
      await fixture.whenStable();
      await showRestaurant({ name: 'El Fogón' });

      expect(page().querySelector('form')).toBeNull();
      expect(page().querySelector('h2')?.textContent).toContain('El Fogón');
      expect(notice()).toContain('Ya tenías un restaurante registrado. Te mostramos sus datos.');
      expect(document.activeElement).toBe(heading());
    });

    it('drops the notice when the restaurant registered meanwhile cannot load', async () => {
      await submitValidForm();
      failWith(REGISTER_URL, 409, 'restaurant.already_registered');
      await fixture.whenStable();
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      expect(notice()).toBe('');
      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu restaurante',
      );
    });

    it('explains that the server cannot be reached and lets the owner try again', async () => {
      await submitValidForm();
      httpTesting.expectOne(REGISTER_URL).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(page().querySelector('form [role="alert"]')?.textContent).toContain('No hay conexión');
      expect(field('name').value).toBe('La Casona');
      expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('leaving the page', () => {
    it('cancels the load when the owner leaves', () => {
      const request = httpTesting.expectOne(MINE_URL);

      fixture.destroy();

      expect(request.cancelled).toBe(true);
    });

    it('cancels the menu summary and a change on their way when the owner leaves', async () => {
      httpTesting.expectOne(MINE_URL).flush(LA_CASONA);
      await fixture.whenStable();
      const menu = httpTesting.expectOne(MENU_URL);
      toggle().click();
      const opening = httpTesting.expectOne(OPEN_URL);

      fixture.destroy();

      expect(menu.cancelled).toBe(true);
      expect(opening.cancelled).toBe(true);
    });

    it('cancels the registration on its way when the owner leaves', async () => {
      await showMissing();
      await submitValidForm();
      const request = httpTesting.expectOne(REGISTER_URL);

      fixture.destroy();

      expect(request.cancelled).toBe(true);
    });
  });

  describe('editing the details', () => {
    const EDIT_URL = '/api/v1/restaurants/mine';

    async function startEditing(changes: Partial<Restaurant> = {}): Promise<void> {
      await showRestaurant(changes);
      button('Editar datos').click();
      await fixture.whenStable();
    }

    it('opens the form with the current details and the focus on the name', async () => {
      await startEditing({ imageUrl: 'https://fotos.pedidos.test/casona.jpg' });

      expect(page().querySelector('app-restaurant-card')).toBeNull();
      expect(page().querySelector('form h2')?.textContent?.trim()).toBe('Editar datos');
      expect(field('name').value).toBe('La Casona');
      expect(field('category').value).toBe('TRADITIONAL');
      expect(field('description').value).toBe('Comida criolla casera');
      expect(field('address').value).toBe('Calle Sucre 245');
      expect(field('imageUrl').value).toBe('https://fotos.pedidos.test/casona.jpg');
      expect(submitButton().textContent?.trim()).toBe('Guardar cambios');
      expect(document.activeElement?.id).toBe('name');
    });

    it('saves the changes, shows them on the card and says so', async () => {
      await startEditing();
      fill('name', 'El Fogón');
      fill('category', 'GRILL');
      fill('imageUrl', 'https://fotos.pedidos.test/fogon.png');

      submitButton().click();
      await fixture.whenStable();

      const request = httpTesting.expectOne(EDIT_URL);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        name: 'El Fogón',
        description: 'Comida criolla casera',
        address: 'Calle Sucre 245',
        category: 'GRILL',
        imageUrl: 'https://fotos.pedidos.test/fogon.png',
      });
      expect(submitButton().textContent).toContain('Guardando…');
      request.flush({
        ...LA_CASONA,
        name: 'El Fogón',
        category: 'GRILL',
        imageUrl: 'https://fotos.pedidos.test/fogon.png',
      });
      await fixture.whenStable();

      expect(page().querySelector('form')).toBeNull();
      expect(page().querySelector('app-restaurant-card h2')?.textContent?.trim()).toBe('El Fogón');
      expect(page().querySelector('[data-category]')?.textContent?.trim()).toBe('Parrillas');
      expect(notice()).toContain('Guardaste los cambios de El Fogón.');
      expect(document.activeElement).toBe(button('Editar datos'));
    });

    it('goes back to the card without saving when the owner cancels', async () => {
      await startEditing();
      fill('name', 'Otro nombre');

      button('Cancelar').click();
      await fixture.whenStable();

      httpTesting.expectNone(EDIT_URL);
      expect(page().querySelector('form')).toBeNull();
      expect(page().querySelector('app-restaurant-card h2')?.textContent?.trim()).toBe('La Casona');
      expect(document.activeElement).toBe(button('Editar datos'));
    });

    it('keeps the form with the reason when the backend rejects a change', async () => {
      await startEditing();

      submitButton().click();
      await fixture.whenStable();
      failWith(EDIT_URL, 422, 'restaurant.invalid_image_url');
      await fixture.whenStable();

      expect(page().querySelector('form [role="alert"]')?.textContent).toContain(
        'Detalle del servidor',
      );
      expect(field('name').value).toBe('La Casona');
      expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    });

    it('offers the registration again when the restaurant no longer exists', async () => {
      await startEditing();

      submitButton().click();
      await fixture.whenStable();
      failWith(EDIT_URL, 404, 'restaurant.not_found');
      await fixture.whenStable();
      failWith(MINE_URL, 404, 'restaurant.not_found');
      await fixture.whenStable();

      expect(page().querySelector('form h2')?.textContent?.trim()).toBe('Datos del restaurante');
      expect(field('name').value).toBe('');
      expect(heading().textContent).toContain('Registra tu restaurante');
    });
  });

  describe('opening and closing', () => {
    it('opens a closed restaurant and says so', async () => {
      await showRestaurant();

      toggle().click();
      await fixture.whenStable();

      const request = httpTesting.expectOne(OPEN_URL);
      expect(request.request.method).toBe('POST');
      expect(toggle().getAttribute('aria-disabled')).toBe('true');
      expect(text()).toContain('Abriendo tu restaurante…');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(status()).toBe('Abierto');
      expect(toggle().getAttribute('aria-checked')).toBe('true');
      expect(toggle().getAttribute('aria-disabled')).toBe('false');
      expect(announced()).toEqual(['Abriste La Casona. Ya recibe pedidos.']);
    });

    it('closes an open restaurant and says so', async () => {
      await showRestaurant({ open: true });

      toggle().click();
      httpTesting.expectOne(CLOSE_URL).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(status()).toBe('Cerrado');
      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(notice()).toContain('Cerraste La Casona. Ya no recibe pedidos nuevos.');
    });

    it('sends a single request when the owner insists', async () => {
      await showRestaurant();

      toggle().click();
      await fixture.whenStable();
      toggle().click();
      await fixture.whenStable();

      httpTesting.expectOne(OPEN_URL).flush(null, { status: 204, statusText: 'No Content' });
      httpTesting.expectNone(CLOSE_URL);
    });

    it('keeps the restaurant as it was when the change fails', async () => {
      await showRestaurant();

      toggle().click();
      failWith(OPEN_URL, 500);
      await fixture.whenStable();

      expect(status()).toBe('Cerrado');
      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(toggle().getAttribute('aria-disabled')).toBe('false');
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');
    });

    it('loads the restaurant again when the admin suspended it meanwhile', async () => {
      await showRestaurant();

      toggle().click();
      failWith(OPEN_URL, 409, 'restaurant.suspended');
      await fixture.whenStable();
      await showRestaurant({ suspended: true });

      expect(status()).toBe('Suspendido');
      expect(page().querySelector('button[role="switch"]')).toBeNull();
      expect(text()).toContain('Tu restaurante está suspendido');
      expect(notice()).toBe('No pudimos abrir tu restaurante: está suspendido.');
      expect(page().querySelector('app-alert[dismissible] [role="alert"]')).toBeTruthy();
      expect(heading().textContent).toContain('Mi restaurante');
      expect(text()).toContain('Revisa en qué estado está tu restaurante.');
      expect(document.activeElement).toBe(heading());
    });

    it('offers the registration again when the restaurant is gone', async () => {
      await showRestaurant({ open: true });

      toggle().click();
      failWith(CLOSE_URL, 404, 'restaurant.not_found');
      await fixture.whenStable();
      await showMissing();

      expect(heading().textContent).toContain('Registra tu restaurante');
      expect(page().querySelector('form')).toBeTruthy();
      expect(notice()).toBe('');
    });

    it('keeps the previous notice until the new change answers', async () => {
      await showRestaurant();
      toggle().click();
      httpTesting.expectOne(OPEN_URL).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      toggle().click();
      await fixture.whenStable();

      expect(notice()).toContain('Abriste La Casona.');
      httpTesting.expectOne(CLOSE_URL).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();
      expect(notice()).toContain('Cerraste La Casona.');
    });

    it('lets the owner dismiss the notice', async () => {
      await showRestaurant();
      toggle().click();
      httpTesting.expectOne(OPEN_URL).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      (page().querySelector('button[aria-label="Cerrar aviso"]') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(notice()).toBe('');
    });

    it('takes the focus back to the switch when the owner closes the notice from it', async () => {
      await showRestaurant();
      toggle().focus();
      toggle().click();
      httpTesting.expectOne(OPEN_URL).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();
      const close = page().querySelector('button[aria-label="Cerrar aviso"]') as HTMLButtonElement;
      close.focus();

      close.click();
      await fixture.whenStable();

      expect(notice()).toBe('');
      expect(document.activeElement).toBe(toggle());
    });
  });

  describe('the menu', () => {
    it('summarizes the menu of the restaurant', async () => {
      await showRestaurant();

      expect(menuSummary()).toBe('1 categoría · 1 producto');
    });

    it('says what the menu holds while it loads', async () => {
      httpTesting.expectOne(MINE_URL).flush(LA_CASONA);
      await fixture.whenStable();

      expect(menuSummary()).toBe('Categorías y productos');
      httpTesting.expectOne(MENU_URL).flush(MENU);
    });

    it('keeps the restaurant in view when the menu cannot load', async () => {
      httpTesting.expectOne(MINE_URL).flush(LA_CASONA);
      await fixture.whenStable();
      failWith(MENU_URL, 500);
      await fixture.whenStable();

      expect(page().querySelector('h2')?.textContent).toContain('La Casona');
      expect(menuSummary()).toBe('Categorías y productos');
      expect(page().querySelector('[role="alert"]')).toBeNull();
    });

    it('tells a new restaurant that its menu is empty without asking for it', async () => {
      await showMissing();
      await submitValidForm();
      httpTesting.expectOne(REGISTER_URL).flush(LA_CASONA, { status: 201, statusText: 'Created' });
      await fixture.whenStable();

      httpTesting.expectNone(MENU_URL);
      expect(menuSummary()).toBe('Todavía no tiene productos');
    });
  });
});
