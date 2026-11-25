import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { ServerEvents } from '@core/live/server-events';
import { BackLink } from '@shared/ui/back-link/back-link';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmationSlot } from '@shared/ui/confirm-panel/confirmation-slot';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Announce } from '@shared/ui/live-region/announce';
import { Announcer } from '@shared/ui/live-region/announcer';
import { LiveStatus } from '@shared/ui/live-status/live-status';
import { LoadError } from '@shared/ui/load-error/load-error';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { Spinner } from '@shared/ui/spinner/spinner';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { OrderChange } from '@shared/utils/order-status';
import { Observable, Subscription } from 'rxjs';
import { OrderCard } from '../../components/order-card/order-card';
import { NewOrderChime } from '../../data-access/new-order-chime';
import { OrderApi } from '../../data-access/order-api';
import {
  ORDER_FILTERS,
  Order,
  OrderAction,
  OrderFilter,
  boardOf,
  cancelledByCustomerMessage,
  copyFor,
  countOrdersIn,
  emptyCopyFor,
  newOrderMessage,
} from '../../models/order';
import { describeOrderError, isOrderChanged } from '../../models/order-error';
import { isNotRegistered } from '../../models/restaurant-error';

const PAGE_SIZE = 20;
const BOARD_SIZE = 100;
const DEFAULT_TITLE = 'Pedidos del restaurante | Pedidos';

interface PendingAction {
  orderId: number;
  action: OrderAction;
}

function withId(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  return new Set(ids).add(id);
}

function withoutId(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

@Component({
  selector: 'app-orders-page',
  imports: [
    Announce,
    BackLink,
    EmptyState,
    LiveStatus,
    LoadError,
    OrderCard,
    PageHeader,
    Pagination,
    SecondaryButton,
    Skeleton,
    Spinner,
    StickyNotice,
  ],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly orderApi = inject(OrderApi);
  private readonly chime = inject(NewOrderChime);
  private readonly announcer = inject(Announcer);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly baseTitle = this.route.snapshot.title ?? DEFAULT_TITLE;
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly orderList = viewChild<ElementRef<HTMLElement>>('orderList');
  private readonly cards = viewChildren(OrderCard);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private quietRequest: Subscription | null = null;
  private requestedPage = 0;
  private staleWhileBusy = false;
  private readonly shownFilter = signal<OrderFilter>('active');

  protected readonly live = inject(ServerEvents).follow<OrderChange>(
    this.orderApi.eventsUrl,
    'order',
  );
  protected readonly filters = (Object.keys(ORDER_FILTERS) as OrderFilter[]).map((filter) => ({
    filter,
    label: ORDER_FILTERS[filter].label,
  }));
  protected readonly placeholders = [1, 2, 3];
  protected readonly filter = signal<OrderFilter>('active');
  protected readonly result = signal<Page<Order> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly pending = signal<PendingAction | null>(null);
  protected readonly pendingIds = signal<ReadonlySet<number>>(new Set());
  protected readonly freshIds = signal<ReadonlySet<number>>(new Set());
  protected readonly soundOn = signal(true);
  protected readonly soundBlocked = signal(false);
  protected readonly notice = new NoticeSlot();
  protected readonly confirmation = new ConfirmationSlot();
  protected readonly busy = computed(() => this.loading() || this.pending() !== null);
  protected readonly empty = computed(() => emptyCopyFor(this.shownFilter()));
  protected readonly board = computed(() => {
    const result = this.result();
    return this.shownFilter() === 'active' && result ? boardOf(result.items) : null;
  });
  protected readonly refreshing = signal(false);
  protected readonly retrying = signal(false);
  protected readonly announcement = signal('');
  protected readonly countLabel = computed(() => {
    const result = this.result();
    return result && result.totalItems > 0
      ? countOrdersIn(this.shownFilter(), result.totalItems)
      : null;
  });

  constructor() {
    this.live.messages$.pipe(takeUntilDestroyed()).subscribe((change) => this.hear(change));
    this.live.reconnected$.pipe(takeUntilDestroyed()).subscribe(() => this.reloadQuietly());
    effect(() => {
      const pendingCount = this.pendingIds().size;
      this.titleService.setTitle(
        pendingCount > 0 ? `(${pendingCount}) ${this.baseTitle}` : this.baseTitle,
      );
    });
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      this.quietRequest?.unsubscribe();
      this.titleService.setTitle(this.baseTitle);
    });
  }

  ngOnInit(): void {
    this.load(0, this.arrivedFromAnotherPage);
  }

  protected show(filter: OrderFilter): void {
    if (this.busy() || filter === this.filter()) {
      return;
    }
    this.filter.set(filter);
    this.notice.clear();
    this.load(0, true);
  }

  protected refresh(): void {
    if (this.busy()) {
      return;
    }
    this.notice.clear();
    this.announcement.set('');
    this.refreshing.set(true);
    this.load(this.requestedPage, false);
  }

  protected goTo(page: number): void {
    if (this.busy()) {
      return;
    }
    this.notice.clear();
    this.load(page, true);
  }

  protected retry(): void {
    this.load(this.requestedPage, true, true);
  }

  protected toggleSound(): void {
    if (this.soundOn()) {
      this.soundOn.set(false);
      this.soundBlocked.set(false);
      return;
    }
    this.soundOn.set(true);
    this.soundBlocked.set(false);
    this.chime.unlock().then((unlocked) => {
      if (!unlocked) {
        this.silence();
      }
    });
  }

  protected workingOn(order: Order): OrderAction | null {
    const pending = this.pending();
    return pending?.orderId === order.id ? pending.action : null;
  }

  protected run(order: Order, action: OrderAction): void {
    if (this.busy()) {
      return;
    }
    this.pending.set({ orderId: order.id, action });
    this.notice.clear();
    this.request = this.orderApi.apply(action, order.id).subscribe({
      next: (changed) => {
        this.pending.set(null);
        this.replace(changed);
        this.notice.show('success', copyFor(action).done(changed.id));
        this.focusCard(changed.id);
        this.catchUp();
      },
      error: (error: unknown) => {
        this.pending.set(null);
        const problem = toProblemDetails(error);
        if (isNotRegistered(problem)) {
          this.leave();
        } else if (isOrderChanged(problem)) {
          this.notice.show(
            'warning',
            `El pedido #${order.id} cambió de estado. Actualizamos la lista.`,
          );
          this.load(this.requestedPage, true);
        } else {
          this.notice.show('danger', describeOrderError(problem));
          this.catchUp();
        }
      },
    });
  }

  private hear(change: OrderChange): void {
    const shown = this.result()?.items.find((order) => order.id === change.orderId);
    if (shown?.status === change.status) {
      return;
    }
    const wasPending = this.pendingIds().has(change.orderId) || shown?.status === 'PLACED';
    if (change.status === 'PLACED') {
      this.pendingIds.update((ids) => withId(ids, change.orderId));
      this.freshIds.update((ids) => withId(ids, change.orderId));
      this.announcer.announce(newOrderMessage(change.orderId, this.pendingIds().size));
      this.ring();
    } else {
      this.pendingIds.update((ids) => withoutId(ids, change.orderId));
      this.freshIds.update((ids) => withoutId(ids, change.orderId));
      if (change.status === 'CANCELLED' && wasPending) {
        this.notice.show('warning', cancelledByCustomerMessage(change.orderId));
      }
    }
    this.reloadQuietly();
  }

  private ring(): void {
    if (!this.soundOn()) {
      return;
    }
    this.chime.play().then((played) => {
      if (!played) {
        this.silence();
      }
    });
  }

  private silence(): void {
    this.soundOn.set(false);
    this.soundBlocked.set(true);
  }

  private reloadQuietly(): void {
    if (this.busy()) {
      this.staleWhileBusy = true;
      return;
    }
    this.staleWhileBusy = false;
    const filter = this.filter();
    const focusWasInList = this.focusIsInList();
    this.quietRequest?.unsubscribe();
    this.quietRequest = this.listOf(filter, this.requestedPage).subscribe({
      next: (result) => {
        if (filter !== this.filter() || this.busy()) {
          return;
        }
        this.display(filter, result);
        if (focusWasInList) {
          this.focusAfterRender(() => {
            if (!this.focusIsInList()) {
              this.header()?.focus();
            }
          });
        }
      },
    });
  }

  private catchUp(): void {
    if (this.staleWhileBusy) {
      this.reloadQuietly();
    }
  }

  private load(page: number, moveFocus: boolean, retrying = false): void {
    this.request?.unsubscribe();
    this.quietRequest?.unsubscribe();
    this.requestedPage = page;
    this.retrying.set(retrying);
    this.loading.set(true);
    this.confirmation.close();
    if (!retrying) {
      this.problem.set(null);
    }
    const filter = this.filter();
    this.request = this.listOf(filter, page).subscribe({
      next: (result) => {
        if (result.items.length === 0 && result.page > 0 && result.totalPages > 0) {
          this.load(result.totalPages - 1, moveFocus, retrying);
          return;
        }
        this.display(filter, result);
        this.problem.set(null);
        this.loading.set(false);
        this.retrying.set(false);
        this.finishRefresh(`Lista actualizada: ${countOrdersIn(filter, result.totalItems)}.`);
        if (moveFocus) {
          this.focusAfterRender(() => this.header()?.focus());
        }
        this.catchUp();
      },
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        if (isNotRegistered(problem)) {
          this.leave();
          return;
        }
        this.problem.set(describeOrderError(problem));
        this.loading.set(false);
        this.retrying.set(false);
        this.finishRefresh('');
        if (moveFocus) {
          this.focusAfterRender(() => this.loadError()?.focus());
        }
      },
    });
  }

  private listOf(filter: OrderFilter, page: number): Observable<Page<Order>> {
    const statuses = ORDER_FILTERS[filter].statuses;
    return filter === 'active'
      ? this.orderApi.list(statuses, 0, BOARD_SIZE)
      : this.orderApi.list(statuses, page, PAGE_SIZE);
  }

  private display(filter: OrderFilter, result: Page<Order>): void {
    this.shownFilter.set(filter);
    this.result.set(result);
    if (filter === 'active') {
      const pendingIds = new Set(
        result.items.filter((order) => order.status === 'PLACED').map((order) => order.id),
      );
      this.pendingIds.set(pendingIds);
      this.freshIds.update((ids) => new Set([...ids].filter((id) => pendingIds.has(id))));
    }
  }

  private finishRefresh(announcement: string): void {
    if (this.refreshing()) {
      this.refreshing.set(false);
      this.announcement.set(announcement);
    }
  }

  private replace(changed: Order): void {
    this.result.update(
      (result) =>
        result && {
          ...result,
          items: result.items.map((item) => (item.id === changed.id ? changed : item)),
        },
    );
    if (changed.status !== 'PLACED') {
      this.pendingIds.update((ids) => withoutId(ids, changed.id));
      this.freshIds.update((ids) => withoutId(ids, changed.id));
    }
  }

  private focusIsInList(): boolean {
    const list = this.orderList()?.nativeElement;
    return Boolean(list && document.activeElement && list.contains(document.activeElement));
  }

  private focusCard(orderId: number): void {
    this.focusAfterRender(() => {
      const card = this.cards().find((candidate) => candidate.order().id === orderId);
      if (card) {
        card.focus();
      } else {
        this.header()?.focus();
      }
    });
  }

  private focusAfterRender(focus: () => void): void {
    afterNextRender(focus, { injector: this.injector });
  }

  private leave(): void {
    this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
  }
}
