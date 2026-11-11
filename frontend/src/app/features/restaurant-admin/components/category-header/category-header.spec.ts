import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryHeader } from './category-header';

@Component({
  imports: [CategoryHeader],
  template: `
    <app-category-header
      [category]="{ id: 5, name: 'Bebidas' }"
      [productCount]="productCount()"
      [deleting]="deleting()"
      [locked]="locked()"
      [(confirming)]="confirming"
      (rename)="renames = renames + 1"
      (deleteConfirmed)="deletions = deletions + 1"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly productCount = signal(0);
  readonly deleting = signal(false);
  readonly locked = signal(false);
  readonly confirming = signal(false);
  renames = 0;
  deletions = 0;
}

describe('CategoryHeader', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function header(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (header().textContent ?? '').replace(/\s+/g, ' ');
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(header().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function withProducts(count: number): Promise<void> {
    host.productCount.set(count);
    await fixture.whenStable();
  }

  async function askToDelete(): Promise<void> {
    button('Borrar').click();
    await fixture.whenStable();
  }

  it('names the category and counts its products', async () => {
    expect(header().querySelector('h2')?.id).toBe('category-5-name');
    expect(text()).toContain('Bebidas · 0 productos');

    await withProducts(1);

    expect(text()).toContain('Bebidas · 1 producto');
  });

  it('asks to rename the category', () => {
    button('Renombrar').click();

    expect(host.renames).toBe(1);
  });

  it('deletes an empty category after the confirmation', async () => {
    await askToDelete();

    expect(text()).toContain('¿Borrar la categoría Bebidas?');
    expect(document.activeElement).toBe(button('Cancelar'));

    button('Sí, borrar').click();
    await fixture.whenStable();

    expect(host.deletions).toBe(1);
    expect(document.activeElement).toBe(button('Borrar'));
  });

  it.each([
    [1, 'Tiene 1 producto. Muévelo a otra categoría o bórralo primero.'],
    [3, 'Tiene 3 productos. Muévelos a otra categoría o bórralos primero.'],
  ])('explains that a category with %s products cannot be deleted', async (count, reason) => {
    await withProducts(count);

    await askToDelete();

    expect(text()).toContain('Todavía no puedes borrar Bebidas');
    expect(text()).toContain(reason);
    expect(header().querySelector('[role="group"]')?.classList).toContain('bg-warning-soft');
    expect(header().querySelectorAll('[role="group"] button')).toHaveLength(1);

    button('Entendido').click();
    await fixture.whenStable();

    expect(header().querySelector('[role="group"]')).toBeNull();
    expect(host.deletions).toBe(0);
  });

  it('closes the question with the escape key on its button', async () => {
    await askToDelete();

    button('Borrar').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(header().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Borrar'));
  });

  it('tells the page whether its question is open', async () => {
    await askToDelete();

    expect(host.confirming()).toBe(true);

    button('Cancelar').click();
    await fixture.whenStable();

    expect(host.confirming()).toBe(false);
  });

  it('closes its question when the page opens another one', async () => {
    await askToDelete();

    host.confirming.set(false);
    await fixture.whenStable();

    expect(header().querySelector('[role="group"]')).toBeNull();
    expect(button('Borrar').getAttribute('aria-expanded')).toBe('false');
  });

  it('says that it is deleting the category', async () => {
    host.deleting.set(true);
    await fixture.whenStable();

    expect(button('Borrando…').getAttribute('aria-disabled')).toBe('true');
    expect(button('Renombrar').getAttribute('aria-disabled')).toBe('true');
  });

  it('waits while another change of the menu is on its way', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    button('Renombrar').click();
    await askToDelete();

    expect(host.renames).toBe(0);
    expect(header().querySelector('[role="group"]')).toBeNull();
  });
});
