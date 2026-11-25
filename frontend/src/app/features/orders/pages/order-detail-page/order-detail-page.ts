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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ServerEvents } from '@core/live/server-events';
import { ORDERS_PATH } from '@core/orders/order-paths';
import { toProblemDetails } from '@core/http/problem-details';
import { BackLink } from '@shared/ui/back-link/back-link';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { Announce } from '@shared/ui/live-region/announce';
import { Announcer } from '@shared/ui/live-region/announcer';
import { LiveStatus } from '@shared/ui/live-status/live-status';
import { LoadError } from '@shared/ui/load-error/load-error';
import { NotFound } from '@shared/ui/not-found/not-found';
import { OrderStatusBadge } from '@shared/ui/order-status-badge/order-status-badge';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { Spinner } from '@shared/ui/spinner/spinner';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { formatDateTime } from '@shared/utils/format-date-time';
import { formatPrice } from '@shared/utils/format-price';
import { OrderChange } from '@shared/utils/order-status';
import { parseId } from '@shared/utils/parse-id';
import { Subscription } from 'rxjs';
import { OrderProgress } from '../../components/order-progress/order-progress';
import { OrderApi } from '../../data-access/order-api';
import {
  Order,
  canCancel,
  isInProgress,
  liveChangeMessage,
  progressOf,
  statusHint,
} from '../../models/order';
import { describeOrderError, isInvalidTransition, isOrderMissing } from '../../models/order-error';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; order: Order };

const ORDER_TITLE = 'Pedido | Pedidos';
const MISSING_TITLE = 'Pedido no encontrado | Pedidos';
const CHANGED_MESSAGE =
  'Tu pedido ya cambió de estado y no se puede cancelar. Te mostramos cómo está ahora.';

function changedWhileCancelling(order: Order): string {
  return order.status === 'ACCEPTED'
    ? `${order.restaurantName} ya aceptó tu pedido. Ya no se puede cancelar.`
    : liveChangeMessage(order);
}

@Component({
  selector: 'app-order-detail-page',
  imports: [
    RouterLink,
    Announce,
    BackLink,
    Button,
    ConfirmPanel,
    LiveStatus,
    LoadError,
    NotFound,
    OrderProgress,
    OrderStatusBadge,
    SecondaryButton,
    Skeleton,
    Spinner,
    StickyNotice,
  ],
  templateUrl: './order-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage {
  private readonly orderApi = inject(OrderApi);
  private readonly announcer = inject(Announcer);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly notFound = viewChild(NotFound);
  private readonly cancelButton = viewChild<ElementRef<HTMLElement>>('cancelButton');
  private readonly cancelArea = viewChild<ElementRef<HTMLElement>>('cancelArea');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private quietRequest: Subscription | null = null;
  private loads = 0;

  readonly id = input.required<string>();

  protected readonly live = inject(ServerEvents).follow<OrderChange>(
    this.orderApi.eventsUrl,
    'order',
  );
  protected readonly ordersPath = ORDERS_PATH;
  protected readonly placeholders = [1, 2];
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly notice = new NoticeSlot();
  protected readonly confirming = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly retrying = signal(false);
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
      tracked: progressOf(order.status) !== null,
      ready: order.status === 'READY',
      rejected: order.status === 'REJECTED',
      question: `¿Cancelar el pedido #${order.id}?`,
      consequence: `${order.restaurantName} ya no lo va a preparar. Esto no se puede deshacer.`,
    };
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id, this.loads > 0 || this.arrivedFromAnotherPage));
    });
    this.live.messages$.pipe(takeUntilDestroyed()).subscribe((change) => this.hear(change));
    this.live.reconnected$.pipe(takeUntilDestroyed()).subscribe(() => this.followUp());
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      this.quietRequest?.unsubscribe();
    });
  }

  protected retry(): void {
    this.load(this.id(), true, true);
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
    this.notice.clear();
    this.focusAfterRender(() => this.cancelButton());
    this.request = this.orderApi.cancel(order.id).subscribe({
      next: (cancelled) => {
        this.cancelling.set(false);
        this.state.set({ status: 'ready', order: cancelled });
        this.notice.show('success', `Cancelaste el pedido #${cancelled.id}.`);
        this.focusAfterRender(() => this.heading());
      },
      error: (error: unknown) => {
        this.cancelling.set(false);
        const problem = toProblemDetails(error);
        if (isInvalidTransition(problem)) {
          this.notice.show('warning', CHANGED_MESSAGE);
          this.refresh(order.id);
        } else if (isOrderMissing(problem)) {
          this.show({ status: 'missing' }, true);
        } else {
          this.notice.show('danger', describeOrderError(problem));
        }
      },
    });
  }

  private hear(change: OrderChange): void {
    const state = this.state();
    if (
      state.status === 'ready' &&
      state.order.id === change.orderId &&
      state.order.status !== change.status
    ) {
      this.followUp();
    }
  }

  private followUp(): void {
    const state = this.state();
    if (state.status !== 'ready' || this.cancelling()) {
      return;
    }
    const focusWasOnCancel = this.focusIsOnCancel();
    this.quietRequest?.unsubscribe();
    this.quietRequest = this.orderApi.get(state.order.id).subscribe({
      next: (order) => {
        const shown = this.state();
        if (shown.status !== 'ready' || shown.order.id !== order.id || this.cancelling()) {
          return;
        }
        this.state.set({ status: 'ready', order });
        if (shown.order.status === order.status) {
          return;
        }
        this.title.setTitle(this.titleOf(this.state()));
        if (this.confirming() && !canCancel(order)) {
          this.confirming.set(false);
          this.notice.show('warning', changedWhileCancelling(order));
        } else {
          this.announcer.announce(liveChangeMessage(order));
        }
        if (focusWasOnCancel && !canCancel(order)) {
          this.focusAfterRender(() => this.heading());
        }
      },
    });
  }

  private focusIsOnCancel(): boolean {
    const area = this.cancelArea()?.nativeElement;
    return Boolean(area && document.activeElement && area.contains(document.activeElement));
  }

  private load(idText: string, moveFocus: boolean, retrying = false): void {
    this.loads += 1;
    this.quietRequest?.unsubscribe();
    this.retrying.set(retrying);
    this.request?.unsubscribe();
    this.confirming.set(false);
    this.cancelling.set(false);
    this.notice.clear();
    const id = parseId(idText);
    if (id === null) {
      this.show({ status: 'missing' }, moveFocus);
      return;
    }
    if (!retrying) {
      this.state.set({ status: 'loading' });
    }
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
    this.retrying.set(false);
    if (state.status !== 'ready') {
      this.notice.clear();
    }
    this.title.setTitle(this.titleOf(state));
    if (moveFocus) {
      afterNextRender(() => this.focus(state), { injector: this.injector });
    }
  }

  private titleOf(state: PageState): string {
    if (state.status === 'ready') {
      const ready = state.order.status === 'READY' ? '¡Listo! ' : '';
      return `${ready}Pedido #${state.order.id} | Pedidos`;
    }
    return state.status === 'missing' ? MISSING_TITLE : ORDER_TITLE;
  }

  private focus(state: PageState): void {
    if (state.status === 'ready') {
      this.heading()?.nativeElement.focus();
    } else if (state.status === 'missing') {
      this.notFound()?.focus();
    } else {
      this.loadError()?.focus();
    }
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
