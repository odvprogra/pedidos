import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SessionStore } from '@core/auth/session-store';
import { CartStore } from '@core/cart/cart-store';
import { Catalog } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import { RestaurantMenuPage } from './restaurant-menu-page';

const RESTAURANT_URL = '/api/v1/restaurants/4';
const CATALOG_URL = '/api/v1/restaurants/4/catalog';
const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: true,
};
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
          description: 'Con arroz y huevo',
          price: 45,
          available: true,
        },
        {
          id: 11,
          categoryId: 3,
          name: 'Pique macho',
          description: null,
          price: 60.5,
          available: false,
        },
      ],
    },
    {
      id: 5,
      name: 'Bebidas',
      products: [
        {
          id: 12,
          categoryId: 5,
          name: 'Limonada',
          description: null,
          price: 10,
          available: true,
        },
      ],
    },
  ],
};

describe('RestaurantMenuPage', () => {
  let fixture: ComponentFixture<RestaurantMenuPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestaurantMenuPage);
  });

  afterEach(() => httpTesting.verify());

  async function open(id: string): Promise<void> {
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function heading(): HTMLElement | null {
    return page().querySelector('h1');
  }

  function categories(): string[] {
    return Array.from(page().querySelectorAll('section section h2'), (category) =>
      category.textContent?.trim(),
    ) as string[];
  }

  function productsOf(category: string): string[] {
    const section = Array.from(page().querySelectorAll('section section')).find((candidate) =>
      candidate.querySelector('h2')?.textContent?.includes(category),
    );
    return Array.from(
      section?.querySelectorAll('h3 > span') ?? [],
      (name) => name.textContent?.trim() ?? '',
    );
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

  function link(label: string): HTMLAnchorElement {
    const found = Array.from(page().querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!found) {
      throw new Error(`No link says ${label}`);
    }
    return found;
  }

  async function respond(
    restaurant: Restaurant = LA_CASONA,
    catalog: Catalog = MENU,
    urls = { restaurant: RESTAURANT_URL, catalog: CATALOG_URL },
  ): Promise<void> {
    httpTesting.expectOne(urls.restaurant).flush(restaurant);
    httpTesting.expectOne(urls.catalog).flush(catalog);
    await fixture.whenStable();
  }

  async function failWith(failing: string, other: string, status: number, code?: string) {
    httpTesting
      .expectOne(failing)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
    expect(httpTesting.expectOne(other).cancelled).toBe(true);
    await fixture.whenStable();
  }

  describe('a visible restaurant', () => {
    it('shows a placeholder while the menu loads', async () => {
      await open('4');

      expect(page().querySelector('[role="status"]')?.textContent).toContain('Cargando el menú');

      await respond();

      expect(page().querySelector('[role="status"]')).toBeNull();
    });

    it('shows the restaurant with its categories in the order of the API', async () => {
      await open('4');
      await respond();

      expect(heading()?.textContent).toContain('La Casona');
      expect(text()).toContain('Calle Sucre 245');
      expect(categories()).toEqual(['Platos fuertes', 'Bebidas']);
      expect(productsOf('Platos fuertes')).toEqual(['Silpancho', 'Pique macho']);
      expect(productsOf('Bebidas')).toEqual(['Limonada']);
    });

    it('shows the prices in bolivianos', async () => {
      await open('4');
      await respond();

      expect(text()).toContain('Bs 45,00');
      expect(text()).toContain('Bs 60,50');
    });

    it('marks the sold out products', async () => {
      await open('4');
      await respond();

      const soldOut = Array.from(page().querySelectorAll('[data-status="sold-out"]'), (badge) =>
        badge.closest('article')?.querySelector('h3 > span')?.textContent?.trim(),
      );
      expect(soldOut).toEqual(['Pique macho']);
    });

    it('names the browser tab after the restaurant', async () => {
      await open('4');
      await respond();

      expect(TestBed.inject(Title).getTitle()).toBe('La Casona | Pedidos');
    });

    it('warns that a closed restaurant does not take orders but still shows its menu', async () => {
      await open('4');
      await respond({ ...LA_CASONA, open: false });

      expect(page().querySelector('[data-status]')?.textContent?.trim()).toBe('Cerrado');
      expect(text()).toContain('Cerrado por ahora');
      expect(categories()).toEqual(['Platos fuertes', 'Bebidas']);
    });

    it('explains that the restaurant has not published its menu yet', async () => {
      await open('4');
      await respond(LA_CASONA, { categories: [] });

      expect(heading()?.textContent).toContain('La Casona');
      expect(text()).toContain('Este restaurante todavía no publicó su menú');
      expect(link('Ver otros restaurantes').getAttribute('href')).toBe('/');
    });

    it('leaves the focus alone when the page is the first one opened', async () => {
      await open('4');
      await respond();

      expect(document.activeElement).not.toBe(heading());
    });
  });

  describe('a restaurant that cannot be shown', () => {
    it('says that a hidden or missing restaurant was not found', async () => {
      await open('4');
      await failWith(RESTAURANT_URL, CATALOG_URL, 404, 'restaurant.not_found');

      expect(heading()?.textContent).toContain('No encontramos este restaurante');
      expect(link('Ver restaurantes').getAttribute('href')).toBe('/');
      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(TestBed.inject(Title).getTitle()).toBe('Restaurante no encontrado | Pedidos');
    });

    it('says the same when only the menu answers that it was not found', async () => {
      await open('4');
      await failWith(CATALOG_URL, RESTAURANT_URL, 404, 'restaurant.not_found');

      expect(heading()?.textContent).toContain('No encontramos este restaurante');
    });

    it('does not ask the API for an id that is not a number', async () => {
      await open('abc');

      httpTesting.expectNone((request) => request.url.startsWith('/api/v1/restaurants'));
      expect(heading()?.textContent).toContain('No encontramos este restaurante');
    });

    it('explains that the menu could not load and loads both again', async () => {
      await open('4');
      await failWith(CATALOG_URL, RESTAURANT_URL, 500);

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar el menú',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');
      expect(heading()?.textContent).toContain('Menú del restaurante');

      button('Reintentar').click();
      await respond();

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(categories()).toEqual(['Platos fuertes', 'Bebidas']);
      expect(document.activeElement).toBe(heading());
    });

    it('does not take a not found without its code for a missing restaurant', async () => {
      await open('4');
      await failWith(RESTAURANT_URL, CATALOG_URL, 404);

      expect(button('Reintentar')).toBeTruthy();
      expect(text()).not.toContain('No encontramos este restaurante');
    });

    it('explains that the server cannot be reached', async () => {
      await open('4');
      httpTesting.expectOne(RESTAURANT_URL).error(new ProgressEvent('error'));
      httpTesting.expectOne(CATALOG_URL);
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });

    it('takes the focus to retry when loading again fails', async () => {
      await open('4');
      await failWith(RESTAURANT_URL, CATALOG_URL, 500);

      button('Reintentar').click();
      await failWith(RESTAURANT_URL, CATALOG_URL, 500);

      expect(document.activeElement).toBe(button('Reintentar'));
    });
  });

  describe('another restaurant in the same page', () => {
    it('loads the new restaurant and takes the focus to its name', async () => {
      await open('4');
      await respond();

      await open('7');
      await respond({ ...LA_CASONA, id: 7, name: 'El Fogón' }, MENU, {
        restaurant: '/api/v1/restaurants/7',
        catalog: '/api/v1/restaurants/7/catalog',
      });

      expect(heading()?.textContent).toContain('El Fogón');
      expect(document.activeElement).toBe(heading());
      expect(TestBed.inject(Title).getTitle()).toBe('El Fogón | Pedidos');
    });

    it('drops the answer of the previous restaurant when it arrives late', async () => {
      await open('4');
      const previous = httpTesting.expectOne(RESTAURANT_URL);
      const previousMenu = httpTesting.expectOne(CATALOG_URL);

      await open('7');

      expect(previous.cancelled).toBe(true);
      expect(previousMenu.cancelled).toBe(true);
      await respond({ ...LA_CASONA, id: 7, name: 'El Fogón' }, MENU, {
        restaurant: '/api/v1/restaurants/7',
        catalog: '/api/v1/restaurants/7/catalog',
      });
      expect(heading()?.textContent).toContain('El Fogón');
    });
  });

  describe('the cart', () => {
    afterEach(() => localStorage.clear());

    function addButtonOf(product: string): HTMLButtonElement {
      const article = Array.from(page().querySelectorAll('article')).find((candidate) =>
        candidate.querySelector('h3 > span')?.textContent?.includes(product),
      );
      const found = article?.querySelector<HTMLButtonElement>('article > div button');
      if (!found) {
        throw new Error(`${product} cannot be added`);
      }
      return found;
    }

    function announcement(): string {
      return page().querySelector('[data-cart-announcement]')?.textContent?.trim() ?? '';
    }

    function summary(): HTMLAnchorElement | null {
      return page().querySelector('app-cart-summary a');
    }

    async function add(product: string): Promise<void> {
      addButtonOf(product).click();
      await fixture.whenStable();
    }

    it('adds products of the restaurant and announces each one', async () => {
      await open('4');
      await respond();

      await add('Silpancho');
      await add('Silpancho');
      await add('Limonada');

      const cart = TestBed.inject(CartStore);
      expect(cart.restaurant()).toEqual({ id: 4, name: 'La Casona', address: 'Calle Sucre 245' });
      expect(cart.quantityOf(10)).toBe(2);
      expect(cart.quantityOf(12)).toBe(1);
      expect(text()).toContain('2 en tu carrito');
      expect(announcement()).toBe('Agregaste Limonada al carrito. Tienes 3 productos.');
    });

    it('shows the way to the cart once it has products of this restaurant', async () => {
      await open('4');
      await respond();
      expect(summary()).toBeNull();

      await add('Silpancho');

      expect(summary()?.getAttribute('href')).toBe('/carrito');
      expect(summary()?.textContent?.replace(/\s+/g, ' ')).toContain('Bs 45,00');
    });

    it('leaves the bar of the phone after the menu, where the tab order reaches it', async () => {
      await open('4');
      await respond();

      await add('Silpancho');

      const summaries = page().querySelectorAll('app-cart-summary');
      const articles = page().querySelectorAll('article');
      const phoneBar = summaries[summaries.length - 1];
      expect(summaries).toHaveLength(2);
      expect(phoneBar.classList).toContain('lg:hidden');
      expect(
        articles[articles.length - 1].compareDocumentPosition(phoneBar) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('does not let a sold out product be added', async () => {
      await open('4');
      await respond();

      expect(addButtonOf('Pique macho').disabled).toBe(true);
      expect(addButtonOf('Silpancho').disabled).toBe(false);
    });

    it('does not let anything be added while the restaurant is closed', async () => {
      await open('4');
      await respond({ ...LA_CASONA, open: false });

      expect(addButtonOf('Silpancho').disabled).toBe(true);
      expect(addButtonOf('Limonada').disabled).toBe(true);
    });

    it.each([
      ['an owner', { id: 3, name: 'Luis Pérez', email: 'luis@correo.com', role: 'OWNER' }],
      ['an admin', { id: 1, name: 'Administrador', email: 'admin@pedidos.com', role: 'ADMIN' }],
    ] as const)('does not offer the cart to %s', async (_case, account) => {
      TestBed.inject(SessionStore).signIn(account);
      await open('4');
      await respond();

      expect(page().querySelectorAll('article > div button')).toHaveLength(0);
    });

    it('keeps a single question about the cart open at a time', async () => {
      TestBed.inject(CartStore).add(
        { id: 7, name: 'El Fogón', address: 'Av. Banzer 120' },
        { id: 20, name: 'Napolitana', price: 70 },
      );
      await open('4');
      await respond();

      await add('Silpancho');
      await add('Limonada');

      const questions = page().querySelectorAll('[role="group"]');
      expect(questions).toHaveLength(1);
      expect(questions[0].textContent).toContain('Si agregas Limonada');
      expect(addButtonOf('Silpancho').getAttribute('aria-expanded')).toBe('false');
      expect(addButtonOf('Limonada').getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement?.textContent?.trim()).toBe('Mantener mi carrito');
      expect(questions[0].contains(document.activeElement)).toBe(true);
    });

    it('asks before replacing a cart of another restaurant', async () => {
      const cart = TestBed.inject(CartStore);
      cart.add(
        { id: 7, name: 'El Fogón', address: 'Av. Banzer 120' },
        { id: 20, name: 'Napolitana', price: 70 },
      );
      await open('4');
      await respond();
      expect(summary()).toBeNull();

      await add('Silpancho');
      expect(cart.restaurant()?.name).toBe('El Fogón');
      expect(text()).toContain('¿Vaciar tu carrito de El Fogón?');

      button('Vaciar y agregar').click();
      await fixture.whenStable();

      expect(cart.restaurant()?.name).toBe('La Casona');
      expect(cart.items().map((item) => item.name)).toEqual(['Silpancho']);
      expect(announcement()).toBe(
        'Vaciaste el carrito de El Fogón y agregaste Silpancho. Tienes 1 producto.',
      );
    });
  });
});
