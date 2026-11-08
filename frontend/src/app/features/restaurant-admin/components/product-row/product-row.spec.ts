import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from '../../models/catalog';
import { ProductRow, ProductTask } from './product-row';

const SILPANCHO: Product = {
  id: 10,
  categoryId: 3,
  name: 'Silpancho',
  description: 'Con arroz y huevo',
  price: 45,
  available: true,
};

@Component({
  imports: [ProductRow],
  template: `
    <app-product-row
      [product]="product()"
      [working]="working()"
      [locked]="locked()"
      (availabilityChange)="availability.push($event)"
      (edit)="edits = edits + 1"
      (deleteConfirmed)="deletions = deletions + 1"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly product = signal(SILPANCHO);
  readonly working = signal<ProductTask | null>(null);
  readonly locked = signal(false);
  readonly availability: boolean[] = [];
  edits = 0;
  deletions = 0;
}

describe('ProductRow', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function row(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (row().textContent ?? '').replace(/\s+/g, ' ');
  }

  function toggle(): HTMLButtonElement {
    return row().querySelector('button[role="switch"]') as HTMLButtonElement;
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(row().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function show(changes: Partial<Product>): Promise<void> {
    host.product.set({ ...SILPANCHO, ...changes });
    await fixture.whenStable();
  }

  it('shows the name, the description and the price in bolivianos', () => {
    expect(row().querySelector('h3')?.textContent).toContain('Silpancho');
    expect(text()).toContain('Con arroz y huevo');
    expect(text()).toContain('Precio: Bs 45,00');
    expect(row().querySelector('[data-status]')).toBeNull();
  });

  it('marks a sold out product', async () => {
    await show({ available: false });

    expect(row().querySelector('[data-status]')?.textContent?.trim()).toBe('Agotado');
    expect(toggle().getAttribute('aria-checked')).toBe('false');
  });

  it('names its switch after the product', () => {
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Disponible: Silpancho');
    expect(toggle().textContent?.trim()).toBe('Disponible');
  });

  it('asks to sell out an available product and to offer a sold out one again', async () => {
    toggle().click();
    await show({ available: false });
    toggle().click();

    expect(host.availability).toEqual([false, true]);
  });

  it('asks to edit the product', () => {
    button('Editar').click();

    expect(host.edits).toBe(1);
  });

  it('asks before deleting and focuses cancel', async () => {
    button('Borrar').click();
    await fixture.whenStable();

    expect(button('Borrar').getAttribute('aria-expanded')).toBe('true');
    expect(text()).toContain('¿Borrar Silpancho del menú?');
    expect(text()).toContain('Los pedidos que ya lo incluían no cambian.');
    expect(document.activeElement).toBe(button('Cancelar'));
    expect(host.deletions).toBe(0);
  });

  it('deletes after the confirmation and returns the focus to its button', async () => {
    button('Borrar').click();
    await fixture.whenStable();

    button('Sí, borrar').click();
    await fixture.whenStable();

    expect(host.deletions).toBe(1);
    expect(row().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Borrar'));
  });

  it('keeps the product when the owner cancels', async () => {
    button('Borrar').click();
    await fixture.whenStable();

    button('Cancelar').click();
    await fixture.whenStable();

    expect(host.deletions).toBe(0);
    expect(row().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Borrar'));
  });

  it('shows the change of availability on its way and ignores the buttons', async () => {
    host.working.set('availability');
    await fixture.whenStable();

    toggle().click();
    button('Editar').click();
    button('Borrar').click();

    expect(toggle().getAttribute('aria-disabled')).toBe('true');
    expect(toggle().querySelector('app-spinner')).toBeTruthy();
    expect(host.availability).toEqual([]);
    expect(host.edits).toBe(0);
    expect(row().querySelector('[role="group"]')).toBeNull();
  });

  it.each([
    [true, 'Marcando como agotado…'],
    [false, 'Marcando como disponible…'],
  ])(
    'says what it is doing while it saves a product available: %s',
    async (available, progress) => {
      await show({ available });
      host.working.set('availability');
      await fixture.whenStable();

      const describedBy = toggle().getAttribute('aria-describedby') ?? '';
      expect(toggle().textContent?.trim()).toBe(progress);
      expect(row().querySelector(`#${describedBy}`)?.textContent).toBe(progress);
      expect(toggle().getAttribute('aria-label')).toBe('Disponible: Silpancho');
    },
  );

  it('describes nothing extra while it is idle', () => {
    expect(toggle().getAttribute('aria-describedby')).toBeNull();
  });

  it('closes the question with the escape key on its button', async () => {
    button('Borrar').click();
    await fixture.whenStable();

    button('Borrar').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(row().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Borrar'));
  });

  it('keeps the question open but ignores it while another change is on its way', async () => {
    button('Borrar').click();
    await fixture.whenStable();
    host.locked.set(true);
    await fixture.whenStable();

    button('Sí, borrar').click();

    expect(button('Sí, borrar').getAttribute('aria-disabled')).toBe('true');
    expect(host.deletions).toBe(0);
  });

  it('says that it is deleting the product', async () => {
    host.working.set('deletion');
    await fixture.whenStable();

    expect(button('Borrando…').getAttribute('aria-disabled')).toBe('true');
  });

  it('waits while another change of the menu is on its way', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    toggle().click();
    button('Editar').click();

    expect(toggle().getAttribute('aria-disabled')).toBe('true');
    expect(button('Editar').getAttribute('aria-disabled')).toBe('true');
    expect(host.availability).toEqual([]);
    expect(host.edits).toBe(0);
  });
});
