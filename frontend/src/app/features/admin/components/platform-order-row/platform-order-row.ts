import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { formatDateTime } from '@shared/utils/format-date-time';
import { formatPrice } from '@shared/utils/format-price';
import { PlatformOrder, describeUnitsOf, listItemsOf } from '../../models/platform-order';

@Component({
  selector: 'app-platform-order-row',
  imports: [OrderStatusBadge],
  templateUrl: './platform-order-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformOrderRow {
  readonly order = input.required<PlatformOrder>();

  protected readonly headingId = computed(() => `platform-order-${this.order().id}`);
  protected readonly initial = computed(() =>
    this.order().restaurantName.trim().charAt(0).toUpperCase(),
  );
  protected readonly placedAt = computed(() => formatDateTime(this.order().placedAt));
  protected readonly units = computed(() => describeUnitsOf(this.order()));
  protected readonly items = computed(() => listItemsOf(this.order()));
  protected readonly total = computed(() => formatPrice(this.order().total));
}
