import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderStatus } from '../../utils/order-status';
import { BadgeSize } from '../badge/badge';
import { OrderStatusBadge } from './order-status-badge';

@Component({
  imports: [OrderStatusBadge],
  template: `<app-order-status-badge [status]="status()" [size]="size()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly status = signal<OrderStatus>('PLACED');
  readonly size = signal<BadgeSize>('md');
}

describe('OrderStatusBadge', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function pill(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('app-badge > span') as HTMLElement;
  }

  it.each([
    ['PLACED', 'Pendiente', 'bg-warning-soft'],
    ['ACCEPTED', 'En preparación', 'bg-info-soft'],
    ['READY', 'Listo para retirar', 'bg-success-soft'],
    ['PICKED_UP', 'Retirado', 'bg-line'],
    ['REJECTED', 'Rechazado', 'bg-danger-soft'],
    ['CANCELLED', 'Cancelado', 'bg-line'],
  ] as const)('shows %s as "%s" with the %s tone', async (status, label, tone) => {
    fixture.componentInstance.status.set(status);
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
