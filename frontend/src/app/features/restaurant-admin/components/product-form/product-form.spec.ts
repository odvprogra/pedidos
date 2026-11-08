import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldViolation } from '@core/http/problem-details';
import { Category, Product, ProductDraft } from '../../models/catalog';
import { ProductForm } from './product-form';

const CATEGORIES: Category[] = [
  { id: 3, name: 'Platos fuertes' },
  { id: 5, name: 'Bebidas' },
];

const SILPANCHO: Product = {
  id: 10,
  categoryId: 3,
  name: 'Silpancho',
  description: 'Con arroz y huevo',
  price: 45.5,
  available: false,
};

@Component({
  imports: [ProductForm],
  template: `
    <app-product-form
      [categories]="categories"
      [categoryId]="categoryId"
      [product]="product"
      [saving]="saving()"
      [errors]="errors()"
      [alert]="alert()"
      (save)="saved.push($event)"
      (cancelled)="cancellations = cancellations + 1"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  categories = CATEGORIES;
  categoryId: number | null = 5;
  product: Product | null = null;
  readonly saving = signal(false);
  readonly errors = signal<FieldViolation[]>([]);
  readonly alert = signal<string | null>(null);
  readonly saved: ProductDraft[] = [];
  cancellations = 0;
}

describe('ProductForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  async function render(product: Product | null = null): Promise<void> {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    host.product = product;
    await fixture.whenStable();
  }

  function form(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function field(id: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return form().querySelector(`#product-${id}`) as HTMLInputElement;
  }

  function messageOf(id: string): string {
    return form().querySelector(`#product-${id}-message`)?.textContent?.trim() ?? '';
  }

  async function fill(id: string, value: string): Promise<void> {
    field(id).value = value;
    field(id).dispatchEvent(new Event(id === 'category' ? 'change' : 'input'));
    field(id).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    (form().querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  describe('a new product', () => {
    beforeEach(() => render());

    it('starts empty in the category where it was opened', () => {
      expect(form().querySelector('h3')?.textContent).toContain('Nuevo producto');
      expect(field('name').value).toBe('');
      expect((field('category') as HTMLSelectElement).selectedOptions[0].textContent).toContain(
        'Bebidas',
      );
      expect(document.activeElement).toBe(field('name'));
    });

    it('sends the product with a price written with a comma', async () => {
      await fill('name', '  Limonada ');
      await fill('description', ' Jarra de un litro ');
      await fill('price', '15,50');
      await submit();

      expect(host.saved).toEqual([
        { categoryId: 5, name: 'Limonada', description: 'Jarra de un litro', price: 15.5 },
      ]);
    });

    it('sends the category the owner chooses', async () => {
      await fill('name', 'Silpancho');
      await fill('price', '45');
      await fill('category', (field('category') as HTMLSelectElement).options[0].value);
      await submit();

      expect(host.saved[0].categoryId).toBe(3);
    });

    it('asks for the name and the price without sending anything', async () => {
      await submit();

      expect(host.saved).toEqual([]);
      expect(messageOf('name')).toBe('Escribe el nombre del producto.');
      expect(messageOf('price')).toBe('Escribe el precio.');
      expect(document.activeElement).toBe(field('name'));
    });

    it.each([
      ['name', '   ', 'Escribe el nombre del producto.'],
      ['name', 'a'.repeat(121), 'Usa hasta 120 caracteres.'],
      ['description', 'a'.repeat(301), 'Usa hasta 300 caracteres.'],
      ['price', 'cuarenta', 'Escribe el precio con números, como 45 o 45,50.'],
      ['price', '45,555', 'Escribe el precio con números, como 45 o 45,50.'],
      ['price', '0', 'El precio tiene que ser mayor a cero.'],
    ])('explains why the %s "%s" is not valid', async (id, value, explanation) => {
      await fill(id, value);

      expect(messageOf(id)).toBe(explanation);
      expect(field(id).getAttribute('aria-invalid')).toBe('true');
    });

    it('counts the characters of the description', async () => {
      const counter = (): string =>
        form().querySelector('#product-description + [aria-hidden="true"]')?.textContent?.trim() ??
        '';

      await fill('description', 'Con arroz');

      expect(counter()).toBe('9/300');
    });

    it('marks the fields rejected by the backend', async () => {
      await fill('name', 'Limonada');
      await fill('price', '15');
      await submit();
      host.errors.set([{ field: 'price', message: 'debe ser mayor que 0' }]);
      await fixture.whenStable();

      expect(messageOf('price')).toBe('debe ser mayor que 0');
      expect(document.activeElement).toBe(field('price'));
    });

    it('shows that it is saving and does not send twice', async () => {
      await fill('name', 'Limonada');
      await fill('price', '15');
      host.saving.set(true);
      await fixture.whenStable();

      await submit();

      expect(form().querySelector('button[type="submit"]')?.textContent).toContain('Guardando…');
      expect(host.saved).toEqual([]);
    });

    it('shows a problem that does not belong to a field', async () => {
      host.alert.set('No hay conexión con el servidor.');
      await fixture.whenStable();

      expect(form().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });

    it('closes with cancel or the escape key', () => {
      (form().querySelector('button[type="button"]') as HTMLButtonElement).click();
      field('name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(host.cancellations).toBe(2);
    });
  });

  describe('an existing product', () => {
    beforeEach(() => render(SILPANCHO));

    it('starts with the data of the product', () => {
      expect(form().querySelector('h3')?.textContent).toContain('Editar Silpancho');
      expect(field('name').value).toBe('Silpancho');
      expect(field('description').value).toBe('Con arroz y huevo');
      expect(field('price').value).toBe('45,50');
      expect((field('category') as HTMLSelectElement).selectedOptions[0].textContent).toContain(
        'Platos fuertes',
      );
    });

    it('sends the changes and an empty description when it is removed', async () => {
      await fill('description', '');
      await fill('price', '48');
      await submit();

      expect(host.saved).toEqual([
        { categoryId: 3, name: 'Silpancho', description: '', price: 48 },
      ]);
    });
  });
});
