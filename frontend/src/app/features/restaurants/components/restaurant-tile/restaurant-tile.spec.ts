import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Restaurant } from '../../models/restaurant';
import { RestaurantTile } from './restaurant-tile';

const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: true,
};

@Component({
  imports: [RestaurantTile],
  template: `<app-restaurant-tile [restaurant]="restaurant()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal(LA_CASONA);
}

describe('RestaurantTile', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function tile(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function link(): HTMLAnchorElement {
    return tile().querySelector('a') as HTMLAnchorElement;
  }

  function text(): string {
    return (tile().textContent ?? '').replace(/\s+/g, ' ');
  }

  function status(): string {
    return tile().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  function textOf(ids: string): string {
    return ids
      .split(' ')
      .map((id) => tile().querySelector(`#${id}`)?.textContent?.trim() ?? '')
      .join(' | ');
  }

  async function show(changes: Partial<Restaurant>): Promise<void> {
    fixture.componentInstance.restaurant.set({ ...LA_CASONA, ...changes });
    await fixture.whenStable();
  }

  it('leads to the menu of the restaurant', () => {
    expect(link().getAttribute('href')).toBe('/4');
  });

  it('shows the name, the description and the address', () => {
    expect(tile().querySelector('h2')?.textContent).toContain('La Casona');
    expect(text()).toContain('Comida criolla casera');
    expect(text()).toContain('Dirección: Calle Sucre 245');
  });

  it('names the link after the restaurant and its status and describes it with the rest', () => {
    expect(textOf(link().getAttribute('aria-labelledby') ?? '')).toBe('La Casona | Abierto');
    expect(textOf(link().getAttribute('aria-describedby') ?? '')).toBe(
      'Comida criolla casera | Dirección: Calle Sucre 245',
    );
  });

  it('marks an open restaurant with the brand color', () => {
    expect(status()).toBe('Abierto');
    expect(tile().querySelector('[data-band]')?.classList).toContain('bg-brand');
  });

  it('marks a closed restaurant in gray', async () => {
    await show({ open: false });

    expect(status()).toBe('Cerrado');
    expect(tile().querySelector('[data-band]')?.classList).toContain('bg-muted');
    expect(textOf(link().getAttribute('aria-labelledby') ?? '')).toBe('La Casona | Cerrado');
  });

  it('leaves out the description when there is none', async () => {
    await show({ description: null });

    expect(tile().querySelector('h2 + p')?.textContent).toContain('Calle Sucre 245');
    expect(textOf(link().getAttribute('aria-describedby') ?? '')).toBe(
      'Dirección: Calle Sucre 245',
    );
  });

  it('shows the initial of the name without reading it aloud', async () => {
    await show({ name: '  el Fogón' });

    const initial = tile().querySelector('[aria-hidden="true"].bg-accent');
    expect(initial?.textContent?.trim()).toBe('E');
  });
});
