import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModerationAction } from '../../models/moderation-action';
import { RestaurantSummary } from '../../models/restaurant-summary';
import { RestaurantRow } from './restaurant-row';

const LA_CASONA: RestaurantSummary = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla',
  address: 'Calle Sucre 245',
  open: true,
  suspended: false,
};

@Component({
  imports: [RestaurantRow],
  template: `
    <app-restaurant-row
      [restaurant]="restaurant()"
      [busy]="busy()"
      [locked]="locked()"
      [(confirming)]="confirming"
      (confirmed)="confirmed.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal(LA_CASONA);
  readonly busy = signal(false);
  readonly locked = signal(false);
  readonly confirming = signal(false);
  readonly confirmed: ModerationAction[] = [];
}

describe('RestaurantRow', () => {
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

  function status(): string {
    return row().querySelector('[data-status]')?.textContent?.trim() ?? '';
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

  async function show(restaurant: Partial<RestaurantSummary>): Promise<void> {
    host.restaurant.set({ ...LA_CASONA, ...restaurant });
    await fixture.whenStable();
  }

  it('shows the name, the address and the status of the restaurant', () => {
    expect(row().textContent).toContain('La Casona');
    expect(row().textContent).toContain('Calle Sucre 245');
    expect(status()).toBe('Abierto');
  });

  it.each([
    [{ open: false }, 'Cerrado'],
    [{ open: false, suspended: true }, 'Suspendido'],
  ])('shows %o as %s', async (state, label) => {
    await show(state);

    expect(status()).toBe(label);
  });

  it('names the restaurant in the action for screen readers', () => {
    expect(button('Suspender').textContent).toContain('La Casona');
  });

  it('asks before suspending and explains what happens to its orders', async () => {
    button('Suspender').click();
    await fixture.whenStable();

    const question = row().querySelector('[role="group"]') as HTMLElement;
    expect(question.id).toBe('restaurant-4-confirm');
    expect(question.textContent).toContain('¿Suspender La Casona?');
    expect(question.textContent).toContain('Su dueño puede terminar los pedidos en curso');
  });

  it('confirms the suspension of an active restaurant', async () => {
    button('Suspender').click();
    await fixture.whenStable();

    button('Sí, suspender').click();

    expect(host.confirmed).toEqual(['suspend']);
  });

  it('offers to reactivate a suspended restaurant and warns that it comes back closed', async () => {
    await show({ open: false, suspended: true });

    button('Reactivar').click();
    await fixture.whenStable();
    expect(row().textContent).toContain('queda cerrado hasta que su dueño lo abra');
    button('Sí, reactivar').click();

    expect(host.confirmed).toEqual(['reactivate']);
  });

  it('does not open the question while another action runs', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    button('Suspender').click();
    await fixture.whenStable();

    expect(button('Suspender').getAttribute('aria-disabled')).toBe('true');
    expect(row().querySelector('[role="group"]')).toBeNull();
  });

  it('shows that it is working on its own action', async () => {
    host.busy.set(true);
    await fixture.whenStable();

    expect(button('Suspendiendo…').getAttribute('aria-disabled')).toBe('true');
  });

  it('tells the page whether its question is open', async () => {
    button('Suspender').click();
    await fixture.whenStable();

    expect(host.confirming()).toBe(true);

    button('Cancelar').click();
    await fixture.whenStable();

    expect(host.confirming()).toBe(false);
  });

  it('closes its question when the page opens another one', async () => {
    button('Suspender').click();
    await fixture.whenStable();

    host.confirming.set(false);
    await fixture.whenStable();

    expect(row().querySelector('[role="group"]')).toBeNull();
  });
});
