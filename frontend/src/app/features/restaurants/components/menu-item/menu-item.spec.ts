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

@Component({
  imports: [MenuItem],
  template: `<app-menu-item [product]="product()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly product = signal(SILPANCHO);
}

describe('MenuItem', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
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
    return item().querySelector('article > p') as HTMLElement;
  }

  async function show(changes: Partial<Product>): Promise<void> {
    fixture.componentInstance.product.set({ ...SILPANCHO, ...changes });
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

    expect(item().querySelectorAll('p')).toHaveLength(1);
  });
});
