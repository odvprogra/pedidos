import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Subscription } from 'rxjs';
import { OrderCard } from '../../components/order-card/order-card';
import { OrderApi } from '../../data-access/order-api';
import {
  ORDER_FILTERS,
  Order,
  OrderAction,
  OrderFilter,
  copyFor,
  emptyCopyFor,
} from '../../models/order';
import { describeOrderError, isOrderChanged } from '../../models/order-error';
import { isNotRegistered } from '../../models/restaurant-error';

const PAGE_SIZE = 20;

interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

interface PendingAction {
  orderId: number;
  action: OrderAction;
}

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, Alert, EmptyState, LoadError, OrderCard, Pagination, SecondaryButton],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly orderApi = inject(OrderApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly loadError = viewChild(LoadError);
  private readonly cards = viewChildren(OrderCard);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private requestedPage = 0;
  private noticeCount = 0;

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
  protected readonly notice = signal<Notice | null>(null);
  protected readonly notices = computed(() => {
    const current = this.notice();
    return current ? [current] : [];
  });
  protected readonly busy = computed(() => this.loading() || this.pending() !== null);
  protected readonly empty = computed(() => emptyCopyFor(this.filter()));

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
    this.notice.set(null);
    this.load(0, true);
  }

  protected refresh(): void {
    if (this.busy()) {
      return;
    }
    this.notice.set(null);
    this.load(this.requestedPage, true);
  }

  protected goTo(page: number): void {
    if (this.busy()) {
      return;
    }
    this.notice.set(null);
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
    this.notice.set(null);
    this.request = this.orderApi.apply(action, order.id).subscribe({
      next: (changed) => {
        this.pending.set(null);
        this.replace(changed);
        this.notify('success', copyFor(action).done(changed.id));
        this.focusCard(changed.id);
      },
      error: (error: unknown) => {
        this.pending.set(null);
        const problem = toProblemDetails(error);
        if (isNotRegistered(problem)) {
          this.leave();
        } else if (isOrderChanged(problem)) {
          this.notify('warning', `El pedido #${order.id} cambió de estado. Actualizamos la lista.`);
          this.load(this.requestedPage, true);
        } else {
          this.notify('danger', describeOrderError(problem));
          this.focusCard(order.id);
        }
      },
    });
  }

  private load(page: number, moveFocus: boolean): void {
    this.request?.unsubscribe();
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    this.request = this.orderApi
      .list(ORDER_FILTERS[this.filter()].statuses, page, PAGE_SIZE)
      .subscribe({
        next: (result) => {
          if (result.items.length === 0 && result.page > 0 && result.totalPages > 0) {
            this.load(result.totalPages - 1, moveFocus);
            return;
          }
          this.result.set(result);
          this.loading.set(false);
          if (moveFocus) {
            this.focusAfterRender(() => this.heading()?.nativeElement.focus());
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
          if (moveFocus) {
            this.focusAfterRender(() => this.loadError()?.focus());
          }
        },
      });
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

  private notify(tone: AlertTone, message: string): void {
    this.noticeCount += 1;
    this.notice.set({ id: this.noticeCount, tone, message });
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
