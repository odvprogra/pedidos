import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from '@shared/ui/badge/badge';
import { Button } from '@shared/ui/button/button';
import { formatPrice } from '@shared/utils/format-price';
import { Order, STATUS_LABELS } from '../../models/order';

@Component({
  selector: 'app-order-placed',
  imports: [RouterLink, Badge, Button],
  templateUrl: './order-placed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPlaced {
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  readonly order = input.required<Order>();
  readonly address = input.required<string>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.order().status]);
  protected readonly total = computed(() => formatPrice(this.order().total));
  protected readonly items = computed(() =>
    this.order().items.map((item) => ({ ...item, subtotalLabel: formatPrice(item.subtotal) })),
  );

  focus(): void {
    this.heading().nativeElement.focus();
  }
}
