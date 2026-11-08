import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Restaurant } from '../../models/restaurant';
import { RestaurantProfile } from './restaurant-profile';

const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: true,
};

@Component({
  imports: [RestaurantProfile],
  template: `<app-restaurant-profile [restaurant]="restaurant()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal(LA_CASONA);
  readonly profile = viewChild.required(RestaurantProfile);
}

describe('RestaurantProfile', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function profile(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (profile().textContent ?? '').replace(/\s+/g, ' ');
  }

  function status(): string {
    return profile().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  async function show(changes: Partial<Restaurant>): Promise<void> {
    fixture.componentInstance.restaurant.set({ ...LA_CASONA, ...changes });
    await fixture.whenStable();
  }

  it('titles the page with the name of the restaurant', () => {
    expect(profile().querySelector('h1')?.textContent).toContain('La Casona');
    expect(text()).toContain('Comida criolla casera');
  });

  it('says where the customer picks up the order', () => {
    expect(text()).toContain('Dirección: Calle Sucre 245');
    expect(text()).toContain('Retiras tu pedido aquí');
  });

  it('tells screen readers the status right after the name', async () => {
    expect(profile().querySelector('[data-status]')?.getAttribute('aria-hidden')).toBe('true');
    expect(profile().querySelector('h1 + [data-status-for-readers]')?.textContent).toBe('Abierto');

    await show({ open: false });

    expect(profile().querySelector('h1 + [data-status-for-readers]')?.textContent).toBe('Cerrado');
  });

  it('shows an open restaurant without a notice', () => {
    expect(status()).toBe('Abierto');
    expect(profile().querySelector('[data-closed-notice]')).toBeNull();
  });

  it('warns that a closed restaurant does not take orders', async () => {
    await show({ open: false });

    expect(status()).toBe('Cerrado');
    expect(profile().querySelector('[data-band]')?.classList).toContain('bg-muted');
    expect(profile().querySelector('[data-closed-notice]')?.textContent).toContain(
      'Cerrado por ahora',
    );
    expect(text()).toContain('No recibe pedidos hasta que abra.');
  });

  it('leaves out the description when there is none', async () => {
    await show({ description: null });

    expect(text()).not.toContain('Comida criolla casera');
    expect(text()).toContain('Calle Sucre 245');
  });

  it('takes the focus to the name when asked', () => {
    fixture.componentInstance.profile().focus();

    expect(document.activeElement).toBe(profile().querySelector('h1'));
  });
});
