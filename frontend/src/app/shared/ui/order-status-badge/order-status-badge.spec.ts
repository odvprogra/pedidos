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

  it('names a pending order in the warning tone', () => {
    expect(pill().textContent?.trim()).toBe('Pendiente');
    expect(pill().classList).toContain('bg-warning-soft');
  });

  it('follows the status of the order', async () => {
    fixture.componentInstance.status.set('READY');
    await fixture.whenStable();

    expect(pill().textContent?.trim()).toBe('Listo para retirar');
    expect(pill().classList).toContain('bg-success-soft');
  });

  it('takes the size of a row', async () => {
    fixture.componentInstance.size.set('sm');
    await fixture.whenStable();

    expect(pill().classList).toContain('text-xs');
  });
});
