import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Restaurant } from '../../models/restaurant';
import { RestaurantCard } from './restaurant-card';

const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: false,
  suspended: false,
};

@Component({
  imports: [RestaurantCard],
  template: `
    <app-restaurant-card
      [restaurant]="restaurant()"
      [busy]="busy()"
      [menuSummary]="menuSummary()"
      (openChange)="requested.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal(LA_CASONA);
  readonly busy = signal(false);
  readonly menuSummary = signal<string | null>(null);
  readonly requested: boolean[] = [];
}

describe('RestaurantCard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function card(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (card().textContent ?? '').replace(/\s+/g, ' ');
  }

  function toggle(): HTMLButtonElement | null {
    return card().querySelector('button[role="switch"]');
  }

  function status(): string {
    return card().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  async function show(changes: Partial<Restaurant>, busy = false): Promise<void> {
    host.restaurant.set({ ...LA_CASONA, ...changes });
    host.busy.set(busy);
    await fixture.whenStable();
  }

  it('shows the name, the description and the address of the restaurant', () => {
    expect(card().querySelector('h2')?.textContent).toContain('La Casona');
    expect(text()).toContain('Comida criolla casera');
    expect(text()).toContain('Dirección: Calle Sucre 245');
    expect(card().querySelector('article')?.getAttribute('aria-labelledby')).toBe(
      card().querySelector('h2')?.id,
    );
  });

  it('leaves out the description when there is none', async () => {
    await show({ description: null });

    expect(card().querySelector('h2 + p')?.textContent).toContain('Calle Sucre 245');
  });

  it('shows a closed restaurant with the switch off', () => {
    expect(status()).toBe('Cerrado');
    expect(toggle()?.getAttribute('aria-checked')).toBe('false');
    expect(text()).toContain('Cerrado: los clientes lo ven, pero no pueden pedir.');
  });

  it('shows an open restaurant with the switch on', async () => {
    await show({ open: true });

    expect(status()).toBe('Abierto');
    expect(toggle()?.getAttribute('aria-checked')).toBe('true');
    expect(text()).toContain('Abierto: los clientes ya pueden hacer pedidos.');
  });

  it('names the switch and explains it', () => {
    const labelId = toggle()?.getAttribute('aria-labelledby') ?? '';
    const hintId = toggle()?.getAttribute('aria-describedby') ?? '';

    expect(card().querySelector(`#${labelId}`)?.textContent).toBe('Recibir pedidos');
    expect(card().querySelector(`#${hintId}`)?.textContent).toContain('Cerrado');
  });

  it('asks to open a closed restaurant', () => {
    toggle()?.click();

    expect(host.requested).toEqual([true]);
  });

  it('asks to close an open restaurant', async () => {
    await show({ open: true });

    toggle()?.click();

    expect(host.requested).toEqual([false]);
  });

  it('says what is happening and asks nothing while a change is on its way', async () => {
    await show({ open: false }, true);

    toggle()?.click();

    expect(toggle()?.getAttribute('aria-disabled')).toBe('true');
    expect(toggle()?.getAttribute('aria-checked')).toBe('false');
    expect(text()).toContain('Abriendo tu restaurante…');
    expect(host.requested).toEqual([]);
  });

  it('explains a suspended restaurant and offers no switch', async () => {
    await show({ suspended: true });

    expect(status()).toBe('Suspendido');
    expect(toggle()).toBeNull();
    expect(text()).toContain('Tu restaurante está suspendido');
    expect(text()).toContain('pero sí terminar los pedidos en curso');
    expect(text()).toContain('Habla con el administrador para reactivarlo.');
  });

  describe('the menu', () => {
    function menuLink(): HTMLAnchorElement | null {
      return card().querySelector('a[href$="/menu"]');
    }

    it('leads to the menu of the restaurant', () => {
      expect(menuLink()?.textContent).toContain('Tu menú');
    });

    it('says what the menu holds while its summary is unknown', () => {
      expect(menuLink()?.textContent).toContain('Categorías y productos');
    });

    it('summarizes the menu once it is known', async () => {
      host.menuSummary.set('2 categorías · 5 productos');
      await fixture.whenStable();

      expect(menuLink()?.textContent).toContain('2 categorías · 5 productos');
      expect(menuLink()?.textContent).not.toContain('Categorías y productos');
    });

    it('stays available while the restaurant is suspended', async () => {
      await show({ suspended: true });

      expect(menuLink()).toBeTruthy();
    });
  });

  describe('the orders', () => {
    function ordersLink(): HTMLAnchorElement | null {
      return card().querySelector('a[href$="/pedidos"]');
    }

    it('leads to the orders of the restaurant before the menu, as the daily task', () => {
      const links = Array.from(card().querySelectorAll('a'), (link) => link.getAttribute('href'));

      expect(ordersLink()?.textContent).toContain('Pedidos');
      expect(links.indexOf(ordersLink()?.getAttribute('href') ?? '')).toBeLessThan(
        links.findIndex((href) => href?.endsWith('/menu')),
      );
    });

    it.each([
      ['closed', { open: false }],
      ['suspended', { suspended: true }],
    ])('stays available while the restaurant is %s', async (_case, change) => {
      await show(change);

      expect(ordersLink()).toBeTruthy();
    });
  });
});
