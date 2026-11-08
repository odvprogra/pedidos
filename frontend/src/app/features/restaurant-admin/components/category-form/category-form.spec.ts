import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldViolation } from '@core/http/problem-details';
import { CategoryForm } from './category-form';

@Component({
  imports: [CategoryForm],
  template: `
    <app-category-form
      heading="Renombrar Bebidas"
      submitLabel="Guardar nombre"
      [initialName]="initialName"
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
  initialName = 'Bebidas';
  readonly saving = signal(false);
  readonly errors = signal<FieldViolation[]>([]);
  readonly alert = signal<string | null>(null);
  readonly saved: string[] = [];
  cancellations = 0;
}

describe('CategoryForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function form(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function nameField(): HTMLInputElement {
    return form().querySelector('#category-name') as HTMLInputElement;
  }

  function message(): string {
    return form().querySelector('#category-name-message')?.textContent?.trim() ?? '';
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(form().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function type(value: string): Promise<void> {
    nameField().value = value;
    nameField().dispatchEvent(new Event('input'));
    nameField().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    (form().querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('starts with the current name and the focus on it', () => {
    expect(form().querySelector('h3')?.textContent).toContain('Renombrar Bebidas');
    expect(nameField().value).toBe('Bebidas');
    expect(document.activeElement).toBe(nameField());
  });

  it('sends the name without spaces around it', async () => {
    await type('  Refrescos ');
    await submit();

    expect(host.saved).toEqual(['Refrescos']);
  });

  it.each([
    ['', 'Escribe el nombre de la categoría.'],
    ['   ', 'Escribe el nombre de la categoría.'],
    ['a'.repeat(61), 'Usa hasta 60 caracteres.'],
  ])('does not send the name "%s" and explains why', async (value, explanation) => {
    await type(value);
    await submit();

    expect(host.saved).toEqual([]);
    expect(message()).toBe(explanation);
    expect(nameField().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(nameField());
  });

  it('accepts a name at its limit', async () => {
    await type('a'.repeat(60));
    await submit();

    expect(host.saved).toEqual(['a'.repeat(60)]);
  });

  it('shows that it is saving and does not send twice', async () => {
    host.saving.set(true);
    await fixture.whenStable();

    await submit();

    expect(button('Guardando…').getAttribute('aria-disabled')).toBe('true');
    expect(host.saved).toEqual([]);
  });

  it('marks the name rejected by the backend and takes the focus to it', async () => {
    await submit();
    (document.activeElement as HTMLElement).blur();

    host.errors.set([{ field: 'name', message: 'Ya tienes una categoría con ese nombre.' }]);
    await fixture.whenStable();

    expect(message()).toBe('Ya tienes una categoría con ese nombre.');
    expect(nameField().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(nameField());
  });

  it('shows a problem that does not belong to the name', async () => {
    host.alert.set('No hay conexión con el servidor.');
    await fixture.whenStable();

    expect(form().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
  });

  it('closes with cancel or the escape key', () => {
    button('Cancelar').click();
    nameField().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(host.cancellations).toBe(2);
  });
});
