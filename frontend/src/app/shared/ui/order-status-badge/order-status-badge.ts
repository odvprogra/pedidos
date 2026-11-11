import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABELS, OrderStatus } from '../../utils/order-status';
import { Badge, BadgeSize, BadgeTone } from '../badge/badge';

const TONES: Record<OrderStatus, BadgeTone> = {
  PLACED: 'warning',
  ACCEPTED: 'info',
  IN_PREPARATION: 'info',
  READY: 'success',
  PICKED_UP: 'neutral',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

@Component({
  selector: 'app-order-status-badge',
  imports: [Badge],
  templateUrl: './order-status-badge.html',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusBadge {
  readonly status = input.required<OrderStatus>();
  readonly size = input<BadgeSize>('md');

  protected readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
  protected readonly tone = computed(() => TONES[this.status()]);
}
