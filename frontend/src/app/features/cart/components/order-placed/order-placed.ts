import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { orderPath } from '@core/orders/order-paths';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { formatPrice } from '@shared/utils/format-price';
import { Order } from '../../models/order';

@Component({
  selector: 'app-order-placed',
  imports: [RouterLink, Button, OrderStatusBadge, SecondaryButton],
  templateUrl: './order-placed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPlaced {
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  readonly order = input.required<Order>();
  readonly address = input.required<string>();

  protected readonly total = computed(() => formatPrice(this.order().total));
  protected readonly orderPath = computed(() => orderPath(this.order().id));
  protected readonly items = computed(() =>
    this.order().items.map((item) => ({ ...item, subtotalLabel: formatPrice(item.subtotal) })),
  );

  focus(): void {
    this.heading().nativeElement.focus();
  }
}
