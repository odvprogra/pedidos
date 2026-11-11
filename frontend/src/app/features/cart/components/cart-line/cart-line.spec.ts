import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartItem } from '@core/cart/cart';
import { CartLine } from './cart-line';

const SILPANCHOS: CartItem = { productId: 10, name: 'Silpancho', price: 45.5, quantity: 2 };

@Component({
  imports: [CartLine],
  template: `<app-cart-line
    [item]="item()"
    [locked]="locked()"
    (quantityChange)="quantities.push($event)"
    (removed)="removals = removals + 1"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly item = signal(SILPANCHOS);
  readonly locked = signal(false);
  readonly quantities: number[] = [];
  removals = 0;
}

describe('CartLine', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function line(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function textOf(selector: string): string {
    return (line().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function button(selector: string): HTMLButtonElement {
    return line().querySelector(selector) as HTMLButtonElement;
  }

  function removeButton(): HTMLButtonElement {
    return Array.from(line().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes('Quitar'),
    ) as HTMLButtonElement;
  }

  async function show(changes: Partial<CartItem>): Promise<void> {
    host.item.set({ ...SILPANCHOS, ...changes });
    await fixture.whenStable();
  }

  it('shows the product, its price, the quantity and the estimated subtotal', () => {
    expect(textOf('h3')).toBe('Silpancho');
    expect(textOf('[data-unit-price]')).toContain('Bs 45,50');
    expect(textOf('[data-quantity]')).toBe('2');
    expect(textOf('[data-subtotal]')).toBe('Subtotal: Bs 91,00');
  });

  it('groups the quantity buttons under the name of the product', () => {
    expect(line().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Cantidad de Silpancho',
    );
  });

  it('asks for one unit more and one unit less', () => {
    button('[data-increase]').click();
    button('[data-decrease]').click();

    expect(host.quantities).toEqual([3, 1]);
  });

  it('does not go below one unit', async () => {
    await show({ quantity: 1 });

    button('[data-decrease]').click();

    expect(button('[data-decrease]').getAttribute('aria-disabled')).toBe('true');
    expect(host.quantities).toEqual([]);
  });

  it('does not go over the maximum quantity', async () => {
    await show({ quantity: 99 });

    button('[data-increase]').click();

    expect(button('[data-increase]').getAttribute('aria-disabled')).toBe('true');
    expect(host.quantities).toEqual([]);
  });

  it('asks to remove the product, named for screen readers', () => {
    removeButton().click();

    expect(removeButton().textContent?.replace(/\s+/g, ' ').trim()).toBe('Quitar Silpancho');
    expect(host.removals).toBe(1);
  });

  it('ignores every change while the order is being placed', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    button('[data-increase]').click();
    button('[data-decrease]').click();
    removeButton().click();

    expect(host.quantities).toEqual([]);
    expect(host.removals).toBe(0);
    expect(removeButton().getAttribute('aria-disabled')).toBe('true');
  });
});
