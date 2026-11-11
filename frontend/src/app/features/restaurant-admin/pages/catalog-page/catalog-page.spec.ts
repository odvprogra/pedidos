import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Announcer } from '@shared/ui/live-region/announcer';
import { Catalog, Product } from '../../models/catalog';
import { CatalogPage } from './catalog-page';

const CATALOG_URL = '/api/v1/restaurants/mine/catalog';
const CATEGORIES_URL = '/api/v1/restaurants/mine/categories';
const PRODUCTS_URL = '/api/v1/restaurants/mine/products';

const SILPANCHO: Product = {
  id: 10,
  categoryId: 3,
  name: 'Silpancho',
  description: 'Con arroz y huevo',
  price: 45,
  available: true,
  imageUrl: null,
};
const PIQUE_MACHO: Product = {
  id: 12,
  categoryId: 3,
  name: 'Pique macho',
  description: null,
  price: 60.5,
  available: false,
  imageUrl: null,
};
const MENU: Catalog = {
  categories: [
    { id: 3, name: 'Platos fuertes', products: [SILPANCHO, PIQUE_MACHO] },
    { id: 5, name: 'Bebidas', products: [] },
  ],
};

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class RestaurantStub {}

describe('CatalogPage', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'mi-restaurante',
            children: [
              { path: '', component: RestaurantStub },
              { path: 'menu', component: CatalogPage },
            ],
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/mi-restaurante/menu');
  });

  afterEach(() => httpTesting.verify());

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function text(within: Element = page()): string {
    return (within.textContent ?? '').replace(/\s+/g, ' ');
  }

  async function stable(): Promise<void> {
    await harness.fixture.whenStable();
  }

  function heading(): HTMLElement {
    return page().querySelector('h1') as HTMLElement;
  }

  function section(name: string): HTMLElement {
    const found = Array.from(page().querySelectorAll('section section')).find((candidate) =>
      candidate.querySelector('h2')?.textContent?.includes(name),
    );
    if (!found) {
      throw new Error(`No category is called ${name}`);
    }
    return found as HTMLElement;
  }

  function productRow(name: string): HTMLElement {
    const found = Array.from(page().querySelectorAll('article')).find((candidate) =>
      candidate.querySelector('h3')?.textContent?.includes(name),
    );
    if (!found) {
      throw new Error(`No product is called ${name}`);
    }
    return found as HTMLElement;
  }

  function button(label: string, within: Element = page()): HTMLButtonElement {
    const found = Array.from(within.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  function byId(id: string): HTMLElement | null {
    return page().querySelector(`#${id}`);
  }

  function notice(): string {
    return page().querySelector('app-alert[dismissible]')?.textContent?.trim() ?? '';
  }

  function namesIn(category: string): string[] {
    return Array.from(section(category).querySelectorAll('h3 span[id]')).map(
      (name) => name.textContent?.trim() ?? '',
    );
  }

  async function fill(id: string, value: string): Promise<void> {
    const field = byId(id) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    await stable();
  }

  async function click(target: HTMLButtonElement): Promise<void> {
    target.click();
    await stable();
  }

  async function submitForm(): Promise<void> {
    await click(page().querySelector('form button[type="submit"]') as HTMLButtonElement);
  }

  function failWith(url: string, status: number, code?: string, extra: object = {}): void {
    httpTesting
      .expectOne(url)
      .flush(
        { status, detail: 'Detalle del servidor', code, ...extra },
        { status, statusText: 'Error' },
      );
  }

  async function showMenu(menu: Catalog = MENU): Promise<void> {
    httpTesting.expectOne(CATALOG_URL).flush(menu);
    await stable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the menu loads', async () => {
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando tu menú…']);

      await showMenu();

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows the categories in order with their products', async () => {
      await showMenu();

      expect(heading().textContent).toContain('Tu menú');
      expect(Array.from(page().querySelectorAll('h2')).map((title) => text(title).trim())).toEqual([
        'Platos fuertes · 2 productos',
        'Bebidas · 0 productos',
      ]);
      expect(namesIn('Platos fuertes')).toEqual(['Silpancho', 'Pique macho']);
      expect(text(productRow('Silpancho'))).toContain('Bs 45,00');
      expect(text(productRow('Pique macho'))).toContain('Bs 60,50');
      expect(productRow('Pique macho').querySelector('[data-status]')?.textContent).toContain(
        'Agotado',
      );
      expect(text(section('Bebidas'))).toContain('Todavía no tiene productos.');
      expect(byId('new-category')?.textContent).toContain('Nueva categoría');
    });

    it('invites the owner to create the first category of an empty menu', async () => {
      await showMenu({ categories: [] });

      expect(text()).toContain('Tu menú está vacío');
      expect(byId('new-category')?.textContent).toContain('Crear la primera categoría');
      expect(page().querySelectorAll('#new-category')).toHaveLength(1);
    });

    it('explains that the menu could not load and loads it again', async () => {
      failWith(CATALOG_URL, 500);
      await stable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu menú',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');

      await click(button('Reintentar'));
      await showMenu();

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(document.activeElement).toBe(heading());
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      failWith(CATALOG_URL, 500);
      await stable();
      const retry = button('Reintentar');
      retry.focus();

      await click(retry);
      retry.click();

      expect(page().querySelector('app-load-error')?.textContent).toContain(
        'No pudimos cargar tu menú',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await showMenu();

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(document.activeElement).toBe(heading());
    });

    it('takes the focus to retry when loading again fails', async () => {
      failWith(CATALOG_URL, 500);
      await stable();

      await click(button('Reintentar'));
      failWith(CATALOG_URL, 500);
      await stable();

      expect(document.activeElement).toBe(button('Reintentar'));
    });

    it('leaves the focus alone when the app opens on the menu', async () => {
      await showMenu();

      expect(document.activeElement).not.toBe(heading());
    });

    it('takes the focus to the title when the owner comes from another page', async () => {
      await showMenu();
      await harness.navigateByUrl('/mi-restaurante');
      await harness.navigateByUrl('/mi-restaurante/menu');
      await showMenu();

      expect(document.activeElement).toBe(heading());
    });

    it('sends an owner without a restaurant to register it', async () => {
      failWith(CATALOG_URL, 404, 'restaurant.not_found');
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });
  });

  describe('leaving the page', () => {
    it('cancels the load when the owner leaves', async () => {
      const request = httpTesting.expectOne(CATALOG_URL);

      await harness.navigateByUrl('/mi-restaurante');

      expect(request.cancelled).toBe(true);
    });

    it('cancels a change on its way when the owner leaves', async () => {
      await showMenu();
      await click(button('Borrar', productRow('Silpancho')));
      await click(button('Sí, borrar'));
      const request = httpTesting.expectOne(`${PRODUCTS_URL}/10`);

      await harness.navigateByUrl('/mi-restaurante');

      expect(request.cancelled).toBe(true);
    });

    it('cancels a form on its way when the owner leaves', async () => {
      await showMenu();
      await click(button('Nueva categoría'));
      await fill('category-name', 'Postres');
      await submitForm();
      const request = httpTesting.expectOne(CATEGORIES_URL);

      await harness.navigateByUrl('/mi-restaurante');

      expect(request.cancelled).toBe(true);
    });
  });

  describe('the categories', () => {
    it('creates a category and offers to add its products', async () => {
      await showMenu();

      await click(button('Nueva categoría'));
      expect(document.activeElement?.id).toBe('category-name');
      await fill('category-name', 'Postres');
      await submitForm();

      const request = httpTesting.expectOne(CATEGORIES_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ name: 'Postres' });
      request.flush({ id: 6, name: 'Postres' }, { status: 201, statusText: 'Created' });
      await stable();

      expect(namesIn('Postres')).toEqual([]);
      expect(page().querySelector('form')).toBeNull();
      expect(notice()).toContain('Creaste la categoría Postres. Ahora agrégale productos.');
      expect(document.activeElement).toBe(byId('add-product-6'));
    });

    it('creates the first category of an empty menu', async () => {
      await showMenu({ categories: [] });

      await click(button('Crear la primera categoría'));
      await fill('category-name', 'Platos fuertes');
      await submitForm();
      httpTesting
        .expectOne(CATEGORIES_URL)
        .flush({ id: 3, name: 'Platos fuertes' }, { status: 201, statusText: 'Created' });
      await stable();

      expect(text()).not.toContain('Tu menú está vacío');
      expect(section('Platos fuertes')).toBeTruthy();
    });

    it('explains that the restaurant already uses the name', async () => {
      await showMenu();

      await click(button('Nueva categoría'));
      await fill('category-name', 'BEBIDAS');
      await submitForm();
      failWith(CATEGORIES_URL, 409, 'catalog.category_name_taken');
      await stable();

      expect(byId('category-name-message')?.textContent).toContain(
        'Ya tienes una categoría con ese nombre.',
      );
      expect(document.activeElement?.id).toBe('category-name');
      expect(notice()).toBe('');
    });

    it('renames a category', async () => {
      await showMenu();

      await click(button('Renombrar', section('Bebidas')));
      expect((byId('category-name') as HTMLInputElement).value).toBe('Bebidas');
      await fill('category-name', 'Refrescos');
      await submitForm();

      const request = httpTesting.expectOne(`${CATEGORIES_URL}/5`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({ name: 'Refrescos' });
      request.flush({ id: 5, name: 'Refrescos' });
      await stable();

      expect(section('Refrescos')).toBeTruthy();
      expect(notice()).toContain('Cambiaste el nombre de la categoría a Refrescos.');
      expect(document.activeElement).toBe(byId('rename-category-5'));
    });

    it('closes a form without saving and returns the focus to where it was opened', async () => {
      await showMenu();

      await click(button('Renombrar', section('Bebidas')));
      await click(button('Cancelar'));

      httpTesting.expectNone(`${CATEGORIES_URL}/5`);
      expect(page().querySelector('form')).toBeNull();
      expect(document.activeElement).toBe(byId('rename-category-5'));
    });

    it('opens the form of a new category after the last one', async () => {
      await showMenu();

      await click(button('Nueva categoría'));

      const position = section('Bebidas').compareDocumentPosition(
        byId('category-name') as HTMLElement,
      );
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(byId('new-category')).toBeNull();
    });

    it('names the category after its form while it is renamed', async () => {
      await showMenu();

      await click(button('Renombrar', section('Bebidas')));

      expect(section('Bebidas').getAttribute('aria-labelledby')).toBe('category-form-title');
      expect(byId('category-form-title')?.textContent).toContain('Renombrar Bebidas');
    });

    it('keeps a single form open', async () => {
      await showMenu();

      await click(button('Nueva categoría'));
      await click(button('Agregar producto', section('Bebidas')));

      expect(page().querySelectorAll('form')).toHaveLength(1);
      expect(byId('category-name')).toBeNull();
      expect(byId('product-name')).toBeTruthy();
    });

    it('deletes an empty category after the confirmation', async () => {
      await showMenu();

      await click(button('Borrar', section('Bebidas')));
      await click(button('Sí, borrar'));

      const request = httpTesting.expectOne(`${CATEGORIES_URL}/5`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await stable();

      expect(page().querySelectorAll('section section')).toHaveLength(1);
      expect(notice()).toContain('Borraste la categoría Bebidas.');
      expect(document.activeElement).toBe(byId('new-category'));
    });

    it('loads the menu again when the category got products meanwhile', async () => {
      await showMenu();

      await click(button('Borrar', section('Bebidas')));
      await click(button('Sí, borrar'));
      failWith(`${CATEGORIES_URL}/5`, 409, 'catalog.category_not_empty');
      await stable();
      await showMenu({
        categories: [
          MENU.categories[0],
          {
            id: 5,
            name: 'Bebidas',
            products: [{ ...SILPANCHO, id: 13, categoryId: 5, name: 'Limonada' }],
          },
        ],
      });

      expect(notice()).toContain('No pudimos borrar la categoría: todavía tiene productos.');
      expect(page().querySelector('app-alert[dismissible] [role="alert"]')).toBeTruthy();
      expect(namesIn('Bebidas')).toEqual(['Limonada']);
      expect(document.activeElement).toBe(heading());
    });
  });

  describe('the products', () => {
    beforeEach(() => showMenu());

    it('adds a product to a category', async () => {
      await click(button('Agregar producto', section('Bebidas')));
      await fill('product-name', 'Limonada');
      await fill('product-price', '15,50');
      await submitForm();

      const request = httpTesting.expectOne(PRODUCTS_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        categoryId: 5,
        name: 'Limonada',
        description: '',
        price: 15.5,
        imageUrl: '',
      });
      request.flush(
        {
          id: 13,
          categoryId: 5,
          name: 'Limonada',
          description: null,
          price: 15.5,
          available: true,
          imageUrl: null,
        },
        { status: 201, statusText: 'Created' },
      );
      await stable();

      expect(namesIn('Bebidas')).toEqual(['Limonada']);
      expect(text(productRow('Limonada'))).toContain('Bs 15,50');
      expect(notice()).toContain('Agregaste Limonada a Bebidas.');
      expect(document.activeElement).toBe(byId('add-product-5'));
    });

    it('edits a product and moves it to another category', async () => {
      await click(button('Editar', productRow('Silpancho')));
      expect((byId('product-price') as HTMLInputElement).value).toBe('45,00');
      const category = byId('product-category') as HTMLSelectElement;
      category.value = category.options[1].value;
      category.dispatchEvent(new Event('change'));
      await fill('product-price', '48');
      await submitForm();

      const request = httpTesting.expectOne(`${PRODUCTS_URL}/10`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        categoryId: 5,
        name: 'Silpancho',
        description: 'Con arroz y huevo',
        price: 48,
        imageUrl: '',
      });
      request.flush({ ...SILPANCHO, categoryId: 5, price: 48 });
      await stable();

      expect(namesIn('Platos fuertes')).toEqual(['Pique macho']);
      expect(namesIn('Bebidas')).toEqual(['Silpancho']);
      expect(notice()).toContain('Guardaste los cambios de Silpancho.');
      expect(document.activeElement).toBe(byId('edit-product-10'));
    });

    it('marks the fields that the backend rejects', async () => {
      await click(button('Agregar producto', section('Bebidas')));
      await fill('product-name', 'Limonada');
      await fill('product-price', '15');
      await submitForm();
      failWith(PRODUCTS_URL, 400, 'validation_failed', {
        errors: [{ field: 'price', message: 'debe ser mayor que 0' }],
      });
      await stable();

      expect(byId('product-price-message')?.textContent).toContain('debe ser mayor que 0');
      expect(page().querySelector('form [role="alert"]')?.textContent).toContain(
        'Revisa los datos marcados',
      );
    });

    it('sends the product once and shows that it is saving', async () => {
      await click(button('Agregar producto', section('Bebidas')));
      await fill('product-name', 'Limonada');
      await fill('product-price', '15');
      await submitForm();
      await submitForm();

      const request = httpTesting.expectOne(PRODUCTS_URL);
      expect(page().querySelector('form button[type="submit"]')?.textContent).toContain(
        'Guardando…',
      );
      request.flush({ ...SILPANCHO, id: 13, categoryId: 5, name: 'Limonada' });
    });

    it('marks a product as sold out', async () => {
      const toggle = (): HTMLButtonElement =>
        productRow('Silpancho').querySelector('button[role="switch"]') as HTMLButtonElement;

      await click(toggle());

      const request = httpTesting.expectOne(`${PRODUCTS_URL}/10/mark-sold-out`);
      expect(request.request.method).toBe('POST');
      expect(toggle().getAttribute('aria-disabled')).toBe('true');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await stable();

      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(productRow('Silpancho').querySelector('[data-status]')?.textContent).toContain(
        'Agotado',
      );
      expect(notice()).toContain('Marcaste Silpancho como agotado.');
    });

    it('offers a sold out product again', async () => {
      await click(
        productRow('Pique macho').querySelector('button[role="switch"]') as HTMLButtonElement,
      );
      httpTesting
        .expectOne(`${PRODUCTS_URL}/12/mark-available`)
        .flush(null, { status: 204, statusText: 'No Content' });
      await stable();

      expect(productRow('Pique macho').querySelector('[data-status]')).toBeNull();
      expect(notice()).toContain('Pique macho vuelve a estar disponible.');
    });

    it('sends a single change while another one is on its way', async () => {
      await click(
        productRow('Silpancho').querySelector('button[role="switch"]') as HTMLButtonElement,
      );
      await click(
        productRow('Pique macho').querySelector('button[role="switch"]') as HTMLButtonElement,
      );
      await click(button('Nueva categoría'));

      httpTesting
        .expectOne(`${PRODUCTS_URL}/10/mark-sold-out`)
        .flush(null, { status: 204, statusText: 'No Content' });
      httpTesting.expectNone(`${PRODUCTS_URL}/12/mark-available`);
      expect(page().querySelector('form')).toBeNull();
    });

    it('keeps the product as it was when the change fails', async () => {
      const toggle = (): HTMLButtonElement =>
        productRow('Silpancho').querySelector('button[role="switch"]') as HTMLButtonElement;

      await click(toggle());
      failWith(`${PRODUCTS_URL}/10/mark-sold-out`, 500);
      await stable();

      expect(toggle().getAttribute('aria-checked')).toBe('true');
      expect(toggle().getAttribute('aria-disabled')).toBe('false');
      expect(page().querySelector('app-alert[dismissible] [role="alert"]')?.textContent).toContain(
        'Detalle del servidor',
      );
    });

    it('announces the same failure again as a new notice', async () => {
      const toggle = (): HTMLButtonElement =>
        productRow('Silpancho').querySelector('button[role="switch"]') as HTMLButtonElement;
      await click(toggle());
      failWith(`${PRODUCTS_URL}/10/mark-sold-out`, 500);
      await stable();
      const first = page().querySelector('app-alert[dismissible]');

      await click(toggle());
      failWith(`${PRODUCTS_URL}/10/mark-sold-out`, 500);
      await stable();

      const second = page().querySelector('app-alert[dismissible]');
      expect(second?.textContent).toContain('Detalle del servidor');
      expect(second).not.toBe(first);
    });

    it('deletes a product after the confirmation', async () => {
      await click(button('Borrar', productRow('Silpancho')));
      await click(button('Sí, borrar'));

      const request = httpTesting.expectOne(`${PRODUCTS_URL}/10`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await stable();

      expect(namesIn('Platos fuertes')).toEqual(['Pique macho']);
      expect(notice()).toContain('Borraste Silpancho del menú.');
      expect(document.activeElement).toBe(byId('add-product-3'));
    });

    it('keeps a single question open across the products and the categories', async () => {
      await click(button('Borrar', productRow('Silpancho')));
      await click(button('Borrar', section('Bebidas')));

      expect(page().querySelectorAll('app-confirm-panel')).toHaveLength(1);
      expect(text(section('Bebidas'))).toContain('¿Borrar la categoría Bebidas?');
      expect(button('Borrar', productRow('Silpancho')).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(button('Cancelar', section('Bebidas')));
    });

    it('closes the question when a form opens, so it does not come back with the row', async () => {
      await click(button('Borrar', productRow('Silpancho')));
      await click(button('Editar', productRow('Silpancho')));
      await click(button('Cancelar', page().querySelector('form') as HTMLElement));

      expect(page().querySelector('app-confirm-panel')).toBeNull();
      expect(button('Borrar', productRow('Silpancho')).getAttribute('aria-expanded')).toBe('false');
    });

    it('closes the question when the menu loads again', async () => {
      await click(button('Borrar', productRow('Silpancho')));
      const toggle = productRow('Pique macho').querySelector(
        'button[role="switch"]',
      ) as HTMLButtonElement;

      await click(toggle);
      failWith(`${PRODUCTS_URL}/12/mark-available`, 404, 'catalog.product_not_found');
      await stable();
      await showMenu();

      expect(page().querySelector('app-confirm-panel')).toBeNull();
      expect(button('Borrar', productRow('Silpancho')).getAttribute('aria-expanded')).toBe('false');
    });

    it('loads the menu again when the product no longer exists', async () => {
      await click(button('Borrar', productRow('Silpancho')));
      await click(button('Sí, borrar'));
      failWith(`${PRODUCTS_URL}/10`, 404, 'catalog.product_not_found');
      await stable();
      await showMenu({
        categories: [{ id: 3, name: 'Platos fuertes', products: [PIQUE_MACHO] }],
      });

      expect(notice()).toContain('Tu menú cambió mientras lo editabas.');
      expect(namesIn('Platos fuertes')).toEqual(['Pique macho']);
    });

    it('closes the form and loads the menu again when the category was deleted meanwhile', async () => {
      await click(button('Agregar producto', section('Bebidas')));
      await fill('product-name', 'Limonada');
      await fill('product-price', '15');
      await submitForm();
      failWith(PRODUCTS_URL, 404, 'catalog.category_not_found');
      await stable();
      await showMenu({ categories: [MENU.categories[0]] });

      expect(page().querySelector('form')).toBeNull();
      expect(notice()).toContain('Tu menú cambió mientras lo editabas.');
    });

    it('sends the owner to register the restaurant when it is gone', async () => {
      await click(
        productRow('Silpancho').querySelector('button[role="switch"]') as HTMLButtonElement,
      );
      failWith(`${PRODUCTS_URL}/10/mark-sold-out`, 404, 'restaurant.not_found');
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });
  });
});
