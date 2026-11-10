import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestaurantState } from '../../utils/restaurant-status';
import { BadgeSize } from '../badge/badge';
import { RestaurantStatusBadge } from './restaurant-status-badge';

@Component({
  imports: [RestaurantStatusBadge],
  template: `<app-restaurant-status-badge [restaurant]="restaurant()" [size]="size()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal<RestaurantState>({ open: false, suspended: false });
  readonly size = signal<BadgeSize>('md');
}

describe('RestaurantStatusBadge', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function pill(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('app-badge > span') as HTMLElement;
  }

  it.each([
    ['an open restaurant', { open: true, suspended: false }, 'Abierto', 'bg-success-soft'],
    ['a closed restaurant', { open: false, suspended: false }, 'Cerrado', 'bg-line'],
    ['a suspended restaurant', { open: false, suspended: true }, 'Suspendido', 'bg-danger-soft'],
  ])('shows %s as "%s" with the %s tone', async (_case, restaurant, label, tone) => {
    fixture.componentInstance.restaurant.set(restaurant);
    await fixture.whenStable();

    expect(pill().textContent?.trim()).toBe(label);
    expect(pill().classList).toContain(tone);
  });

  it('takes the size of a row', async () => {
    fixture.componentInstance.size.set('sm');
    await fixture.whenStable();

    expect(pill().classList).toContain('text-xs');
  });
});
