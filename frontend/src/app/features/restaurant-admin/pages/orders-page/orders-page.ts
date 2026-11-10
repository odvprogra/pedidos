import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { BackLink } from '@shared/ui/back-link/back-link';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { Spinner } from '@shared/ui/spinner/spinner';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { Subscription } from 'rxjs';
import { OrderCard } from '../../components/order-card/order-card';
import { OrderApi } from '../../data-access/order-api';
import {
  ORDER_FILTERS,
  Order,
  OrderAction,
  OrderFilter,
  copyFor,
  countOrdersIn,
  emptyCopyFor,
} from '../../models/order';
import { describeOrderError, isOrderChanged } from '../../models/order-error';
import { isNotRegistered } from '../../models/restaurant-error';

const PAGE_SIZE = 20;

interface PendingAction {
  orderId: number;
  action: OrderAction;
}

@Component({
  selector: 'app-orders-page',
  imports: [
    BackLink,
    EmptyState,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly cards = viewChildren(OrderCard);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private requestedPage = 0;
  private readonly shownFilter = signal<OrderFilter>('active');

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
  protected readonly notice = new NoticeSlot();
  protected readonly busy = computed(() => this.loading() || this.pending() !== null);
  protected readonly empty = computed(() => emptyCopyFor(this.shownFilter()));
  protected readonly refreshing = signal(false);
  protected readonly announcement = signal('');
  protected readonly countLabel = computed(() => {
    const result = this.result();
    return result && result.totalItems > 0
      ? countOrdersIn(this.shownFilter(), result.totalItems)
      : null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
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
    this.load(this.requestedPage, true);
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
        }
      },
    });
  }

  private load(page: number, moveFocus: boolean): void {
    this.request?.unsubscribe();
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    const filter = this.filter();
    this.request = this.orderApi.list(ORDER_FILTERS[filter].statuses, page, PAGE_SIZE).subscribe({
      next: (result) => {
        if (result.items.length === 0 && result.page > 0 && result.totalPages > 0) {
          this.load(result.totalPages - 1, moveFocus);
          return;
        }
        this.shownFilter.set(filter);
        this.result.set(result);
        this.loading.set(false);
        this.finishRefresh(`Lista actualizada: ${countOrdersIn(filter, result.totalItems)}.`);
        if (moveFocus) {
          this.focusAfterRender(() => this.header()?.focus());
        }
      },
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        if (isNotRegistered(problem)) {
          this.leave();
          return;
        }
        this.problem.set(describeOrderError(problem));
        this.loading.set(false);
        this.finishRefresh('');
        if (moveFocus) {
          this.focusAfterRender(() => this.loadError()?.focus());
        }
      },
    });
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
  }

  private focusCard(orderId: number): void {
    this.focusAfterRender(() =>
      this.cards()
        .find((card) => card.order().id === orderId)
        ?.focus(),
    );
  }

  private focusAfterRender(focus: () => void): void {
    afterNextRender(focus, { injector: this.injector });
  }

  private leave(): void {
    this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
  }
}
