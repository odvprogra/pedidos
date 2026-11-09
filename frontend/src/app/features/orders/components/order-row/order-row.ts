import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { orderPath } from '@core/orders/order-paths';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { formatDateTime } from '@shared/utils/format-date-time';
import { formatPrice } from '@shared/utils/format-price';
import { ORDER_STATUS_LABELS } from '@shared/utils/order-status';
import { Order, describeItems } from '../../models/order';

@Component({
  selector: 'app-order-row',
  imports: [RouterLink, OrderStatusBadge],
  templateUrl: './order-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderRow {
  readonly order = input.required<Order>();

  protected readonly path = computed(() => orderPath(this.order().id));
  protected readonly label = computed(() => {
    const order = this.order();
    return `Pedido #${order.id} de ${order.restaurantName}, ${ORDER_STATUS_LABELS[order.status]}`;
  });
  protected readonly detailsId = computed(() => `order-${this.order().id}-details`);
  protected readonly initial = computed(() =>
    this.order().restaurantName.trim().charAt(0).toUpperCase(),
  );
  protected readonly placedAt = computed(() => formatDateTime(this.order().placedAt));
  protected readonly items = computed(() => describeItems(this.order()));
  protected readonly total = computed(() => formatPrice(this.order().total));
}
