import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { Spinner } from '@shared/ui/spinner/spinner';
import { formatDateTime } from '@shared/utils/format-date-time';
import { formatPrice } from '@shared/utils/format-price';
import { Order, OrderAction, actionsFor, copyFor } from '../../models/order';

@Component({
  selector: 'app-order-card',
  imports: [Button, ConfirmPanel, OrderStatusBadge, SecondaryButton, Spinner],
  templateUrl: './order-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCard {
  private readonly injector = inject(Injector);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly rejectButton = viewChild<ElementRef<HTMLButtonElement>>('rejectButton');
  private readonly actionButtons = viewChildren<ElementRef<HTMLButtonElement>>('actionButton');

  readonly order = input.required<Order>();
  readonly working = input<OrderAction | null>(null);
  readonly locked = input(false);
  readonly acted = output<OrderAction>();

  protected readonly confirmingReject = linkedSignal({
    source: () => this.order().status,
    computation: () => false,
  });
  protected readonly actions = computed(() =>
    actionsFor(this.order()).map((action) => ({ action, copy: copyFor(action) })),
  );
  protected readonly unavailable = computed(() => this.working() !== null || this.locked());
  protected readonly placedAt = computed(() => formatDateTime(this.order().placedAt));
  protected readonly total = computed(() => formatPrice(this.order().total));
  protected readonly items = computed(() =>
    this.order().items.map((item) => ({ ...item, subtotalLabel: formatPrice(item.subtotal) })),
  );
  protected readonly headingId = computed(() => `order-${this.order().id}-heading`);
  protected readonly confirmId = computed(() => `order-${this.order().id}-reject`);
  protected readonly rejectQuestion = computed(() => `¿Rechazar el pedido #${this.order().id}?`);

  focus(): void {
    const first = this.actionButtons()[0];
    (first ?? this.heading()).nativeElement.focus();
  }

  protected run(action: OrderAction, event: MouseEvent): void {
    if (this.unavailable() || event.detail > 1) {
      return;
    }
    if (action === 'reject') {
      this.confirmingReject.update((open) => !open);
      return;
    }
    this.confirmingReject.set(false);
    this.acted.emit(action);
  }

  protected dismiss(): void {
    if (this.confirmingReject()) {
      this.keep();
    }
  }

  protected keep(): void {
    this.confirmingReject.set(false);
    afterNextRender(() => this.rejectButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected confirmReject(): void {
    if (this.unavailable()) {
      return;
    }
    this.confirmingReject.set(false);
    this.acted.emit('reject');
    afterNextRender(() => this.rejectButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
