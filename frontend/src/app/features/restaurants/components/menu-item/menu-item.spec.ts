import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from '../../models/catalog';
import { MenuItem } from './menu-item';

const SILPANCHO: Product = {
  id: 10,
  categoryId: 3,
  name: 'Silpancho',
  description: 'Con arroz y huevo',
  price: 45,
  available: true,
};
const SILPANCHO_SOLD_OUT: Product = { ...SILPANCHO, available: false };

@Component({
  imports: [MenuItem],
  template: `<app-menu-item
    [product]="product()"
    [canOrder]="canOrder()"
    [restaurantOpen]="restaurantOpen()"
    [quantityInCart]="quantityInCart()"
    [otherRestaurant]="otherRestaurant()"
    [(confirming)]="confirming"
    (added)="adds = adds + 1"
    (replaced)="replacements = replacements + 1"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly product = signal(SILPANCHO);
  readonly canOrder = signal(true);
  readonly restaurantOpen = signal(true);
  readonly quantityInCart = signal(0);
  readonly otherRestaurant = signal<string | null>(null);
  readonly confirming = signal(false);
  adds = 0;
  replacements = 0;
}

describe('MenuItem', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function item(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (item().textContent ?? '').replace(/\s+/g, ' ');
  }

  function name(): HTMLElement {
    return item().querySelector('h3 > span') as HTMLElement;
  }

  function price(): HTMLElement {
    return item().querySelector('[data-price]') as HTMLElement;
  }

  function addButton(): HTMLButtonElement | null {
    return item().querySelector('article > div button');
  }

  function panelButton(label: string): HTMLButtonElement {
    const found = Array.from(item().querySelectorAll('[role="group"] button')).find((button) =>
      button.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found as HTMLButtonElement;
  }

  async function show(changes: Partial<Product>): Promise<void> {
    host.product.set({ ...SILPANCHO, ...changes });
    await fixture.whenStable();
  }

  async function click(button: HTMLButtonElement | null): Promise<void> {
    button?.click();
    await fixture.whenStable();
  }

  it('shows the name, the description and the price in bolivianos', () => {
    expect(name().textContent?.trim()).toBe('Silpancho');
    expect(text()).toContain('Con arroz y huevo');
    expect(price().textContent?.replace(/\s+/g, ' ').trim()).toBe('Precio: Bs 45,00');
  });

  it('names its row after the product', () => {
    const article = item().querySelector('article');

    expect(article?.getAttribute('aria-labelledby')).toBe(name().id);
  });

  it('shows an available product without a badge', () => {
    expect(item().querySelector('[data-status]')).toBeNull();
    expect(name().classList).not.toContain('text-muted');
  });

  it('marks a sold out product and dims it', async () => {
    await show({ available: false });

    expect(item().querySelector('[data-status]')?.textContent?.trim()).toBe('Agotado');
    expect(name().classList).toContain('text-muted');
    expect(price().classList).toContain('text-muted');
  });

  it('leaves out the description when there is none', async () => {
    await show({ description: null });

    expect(text()).not.toContain('Con arroz y huevo');
    expect(item().querySelectorAll('h3 ~ p')).toHaveLength(0);
  });

  describe('adding to the cart', () => {
    it('offers to add the product, named for screen readers', () => {
      expect(addButton()?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Agregar Silpancho al carrito',
      );
      expect(addButton()?.disabled).toBe(false);
    });

    it('asks to add the product', async () => {
      await click(addButton());

      expect(host.adds).toBe(1);
    });

    it('does not offer to add when the account cannot order', async () => {
      host.canOrder.set(false);
      host.quantityInCart.set(2);
      await fixture.whenStable();

      expect(addButton()).toBeNull();
      expect(item().querySelector('[data-in-cart]')).toBeNull();
    });

    it.each([
      ['the product is sold out', SILPANCHO_SOLD_OUT, true],
      ['the restaurant is closed', SILPANCHO, false],
    ])('disables the button when %s', async (_case, product, open) => {
      host.product.set(product);
      host.restaurantOpen.set(open);
      await fixture.whenStable();

      expect(addButton()?.disabled).toBe(true);
      await click(addButton());
      expect(host.adds).toBe(0);
    });

    it('says how many units are already in the cart', async () => {
      host.quantityInCart.set(2);
      await fixture.whenStable();

      const inCart = item().querySelector('[data-in-cart]') as HTMLElement;
      expect(inCart.textContent?.replace(/\s+/g, ' ').trim()).toBe('2 en tu carrito');
      expect(addButton()?.getAttribute('aria-describedby')).toBe(inCart.id);
    });

    it('stops adding at the maximum quantity without losing the focus', async () => {
      host.quantityInCart.set(99);
      await fixture.whenStable();

      await click(addButton());

      expect(addButton()?.disabled).toBe(false);
      expect(addButton()?.getAttribute('aria-disabled')).toBe('true');
      expect(host.adds).toBe(0);
      expect(text()).toContain('99 en tu carrito · máximo por pedido');
    });
  });

  describe('when the cart has products of another restaurant', () => {
    beforeEach(async () => {
      host.otherRestaurant.set('El Fogón');
      await fixture.whenStable();
    });

    it('asks before emptying the cart instead of adding', async () => {
      await click(addButton());

      const panel = item().querySelector('[role="group"]') as HTMLElement;
      expect(panel.textContent).toContain('¿Vaciar tu carrito de El Fogón?');
      expect(panel.textContent).toContain('Si agregas Silpancho, se quitan los de El Fogón.');
      expect(addButton()?.getAttribute('aria-expanded')).toBe('true');
      expect(addButton()?.getAttribute('aria-controls')).toBe(panel.id);
      expect(document.activeElement).toBe(panelButton('Mantener mi carrito'));
      expect(host.adds).toBe(0);
    });

    it('keeps the cart and goes back to the button when it is cancelled', async () => {
      await click(addButton());

      await click(panelButton('Mantener mi carrito'));

      expect(item().querySelector('[role="group"]')).toBeNull();
      expect(host.replacements).toBe(0);
      expect(document.activeElement).toBe(addButton());
    });

    it('asks to start a new cart when it is confirmed', async () => {
      await click(addButton());

      await click(panelButton('Vaciar y agregar'));

      expect(host.replacements).toBe(1);
      expect(host.adds).toBe(0);
      expect(item().querySelector('[role="group"]')).toBeNull();
      expect(document.activeElement).toBe(addButton());
    });

    it('tells the page whether its question is open', async () => {
      await click(addButton());

      expect(host.confirming()).toBe(true);

      await click(panelButton('Mantener mi carrito'));

      expect(host.confirming()).toBe(false);
    });

    it('closes its question when the page opens another one', async () => {
      await click(addButton());

      host.confirming.set(false);
      await fixture.whenStable();

      expect(item().querySelector('[role="group"]')).toBeNull();
      expect(addButton()?.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes the question with the escape key on its button', async () => {
      await click(addButton());
      addButton()?.focus();

      addButton()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();

      expect(item().querySelector('[role="group"]')).toBeNull();
      expect(host.confirming()).toBe(false);
      expect(document.activeElement).toBe(addButton());
    });

    it('ignores the escape key while there is no question', async () => {
      addButton()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();

      expect(host.confirming()).toBe(false);
      expect(host.adds).toBe(0);
    });

    it('closes the question when the button is pressed again', async () => {
      await click(addButton());

      await click(addButton());

      expect(item().querySelector('[role="group"]')).toBeNull();
      expect(addButton()?.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
