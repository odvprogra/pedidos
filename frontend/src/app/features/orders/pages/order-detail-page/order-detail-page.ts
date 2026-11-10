import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ORDERS_PATH } from '@core/orders/order-paths';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { BackLink } from '@shared/ui/back-link/back-link';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { LoadError } from '@shared/ui/load-error/load-error';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { Spinner } from '@shared/ui/spinner/spinner';
import { formatDateTime } from '@shared/utils/format-date-time';
import { formatPrice } from '@shared/utils/format-price';
import { parseId } from '@shared/utils/parse-id';
import { Subscription } from 'rxjs';
import { OrderApi } from '../../data-access/order-api';
import { Order, canCancel, isInProgress, statusHint } from '../../models/order';
import { describeOrderError, isInvalidTransition, isOrderMissing } from '../../models/order-error';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; order: Order };

interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

const ORDER_TITLE = 'Pedido | Pedidos';
const MISSING_TITLE = 'Pedido no encontrado | Pedidos';
const CHANGED_MESSAGE =
  'Tu pedido ya cambió de estado y no se puede cancelar. Te mostramos cómo está ahora.';

@Component({
  selector: 'app-order-detail-page',
  imports: [
    RouterLink,
    Alert,
    BackLink,
    Button,
    ConfirmPanel,
    LoadError,
    OrderStatusBadge,
    SecondaryButton,
    Skeleton,
    Spinner,
  ],
  templateUrl: './order-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage {
  private readonly orderApi = inject(OrderApi);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly missingHeading = viewChild<ElementRef<HTMLElement>>('missingHeading');
  private readonly cancelButton = viewChild<ElementRef<HTMLElement>>('cancelButton');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private loads = 0;
  private noticeCount = 0;

  readonly id = input.required<string>();

  protected readonly ordersPath = ORDERS_PATH;
  protected readonly placeholders = [1, 2];
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly notice = signal<Notice | null>(null);
  protected readonly notices = computed(() => {
    const current = this.notice();
    return current ? [current] : [];
  });
  protected readonly confirming = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly details = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') {
      return null;
    }
    const order = state.order;
    return {
      order,
      hint: statusHint(order),
      placedAt: formatDateTime(order.placedAt),
      updatedAt: order.updatedAt === order.placedAt ? null : formatDateTime(order.updatedAt),
      initial: order.restaurantName.trim().charAt(0).toUpperCase(),
      restaurantPath: `/restaurantes/${order.restaurantId}`,
      total: formatPrice(order.total),
      items: order.items.map((item) => ({ ...item, subtotalLabel: formatPrice(item.subtotal) })),
      cancellable: canCancel(order),
      inProgress: isInProgress(order),
      question: `¿Cancelar el pedido #${order.id}?`,
      consequence: `${order.restaurantName} ya no lo va a preparar. Esto no se puede deshacer.`,
    };
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id, this.loads > 0 || this.arrivedFromAnotherPage));
    });
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  protected retry(): void {
    this.load(this.id(), true);
  }

  protected toggleConfirm(): void {
    if (this.confirming()) {
      this.keep();
    } else if (!this.cancelling()) {
      this.confirming.set(true);
    }
  }

  protected dismiss(): void {
    if (this.confirming()) {
      this.keep();
    }
  }

  protected keep(): void {
    this.confirming.set(false);
    this.focusAfterRender(() => this.cancelButton());
  }

  protected cancel(order: Order): void {
    if (this.cancelling()) {
      return;
    }
    this.confirming.set(false);
    this.cancelling.set(true);
    this.notice.set(null);
    this.focusAfterRender(() => this.cancelButton());
    this.request = this.orderApi.cancel(order.id).subscribe({
      next: (cancelled) => {
        this.cancelling.set(false);
        this.state.set({ status: 'ready', order: cancelled });
        this.notify('success', `Cancelaste el pedido #${cancelled.id}.`);
        this.focusAfterRender(() => this.heading());
      },
      error: (error: unknown) => {
        this.cancelling.set(false);
        const problem = toProblemDetails(error);
        if (isInvalidTransition(problem)) {
          this.notify('warning', CHANGED_MESSAGE);
          this.refresh(order.id);
        } else if (isOrderMissing(problem)) {
          this.show({ status: 'missing' }, true);
        } else {
          this.notify('danger', describeOrderError(problem));
        }
      },
    });
  }

  private load(idText: string, moveFocus: boolean): void {
    this.loads += 1;
    this.request?.unsubscribe();
    this.confirming.set(false);
    this.cancelling.set(false);
    this.notice.set(null);
    const id = parseId(idText);
    if (id === null) {
      this.show({ status: 'missing' }, moveFocus);
      return;
    }
    this.state.set({ status: 'loading' });
    this.request = this.orderApi.get(id).subscribe({
      next: (order) => this.show({ status: 'ready', order }, moveFocus),
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        this.show(
          isOrderMissing(problem)
            ? { status: 'missing' }
            : { status: 'failed', message: describeOrderError(problem) },
          moveFocus,
        );
      },
    });
  }

  private refresh(id: number): void {
    this.request = this.orderApi.get(id).subscribe({
      next: (order) => {
        this.state.set({ status: 'ready', order });
        this.focusAfterRender(() => this.heading());
      },
      error: (error: unknown) =>
        this.show({ status: 'failed', message: describeOrderError(toProblemDetails(error)) }, true),
    });
  }

  private show(state: PageState, moveFocus: boolean): void {
    this.state.set(state);
    if (state.status !== 'ready') {
      this.notice.set(null);
    }
    this.title.setTitle(this.titleOf(state));
    if (moveFocus) {
      afterNextRender(() => this.focus(state), { injector: this.injector });
    }
  }

  private titleOf(state: PageState): string {
    if (state.status === 'ready') {
      return `Pedido #${state.order.id} | Pedidos`;
    }
    return state.status === 'missing' ? MISSING_TITLE : ORDER_TITLE;
  }

  private focus(state: PageState): void {
    if (state.status === 'ready') {
      this.heading()?.nativeElement.focus();
    } else if (state.status === 'missing') {
      this.missingHeading()?.nativeElement.focus();
    } else {
      this.loadError()?.focus();
    }
  }

  private notify(tone: AlertTone, message: string): void {
    this.noticeCount += 1;
    this.notice.set({ id: this.noticeCount, tone, message });
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
