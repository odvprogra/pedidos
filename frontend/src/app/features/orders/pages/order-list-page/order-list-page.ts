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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { ServerEvents } from '@core/live/server-events';
import { Button } from '@shared/ui/button/button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Announce } from '@shared/ui/live-region/announce';
import { Announcer } from '@shared/ui/live-region/announcer';
import { LiveStatus } from '@shared/ui/live-status/live-status';
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { OrderChange } from '@shared/utils/order-status';
import { Subscription } from 'rxjs';
import { OrderRow } from '../../components/order-row/order-row';
import { OrderApi } from '../../data-access/order-api';
import { Order, countOrders, liveChangeMessage } from '../../models/order';
import { describeOrderError } from '../../models/order-error';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-order-list-page',
  imports: [
    RouterLink,
    Announce,
    Button,
    CountPill,
    EmptyState,
    LiveStatus,
    LoadError,
    OrderRow,
    PageHeader,
    Pagination,
    Skeleton,
  ],
  templateUrl: './order-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderListPage implements OnInit {
  private readonly orderApi = inject(OrderApi);
  private readonly announcer = inject(Announcer);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly orderList = viewChild<ElementRef<HTMLElement>>('orderList');
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private requestedPage = 0;
  private quietRequest: Subscription | null = null;

  protected readonly live = inject(ServerEvents).follow<OrderChange>(
    this.orderApi.eventsUrl,
    'order',
  );
  protected readonly placeholders = [1, 2, 3];
  protected readonly result = signal<Page<Order> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly retrying = signal(false);
  protected readonly totalLabel = computed(() => countOrders(this.result()?.totalItems ?? 0));

  constructor() {
    this.live.messages$.pipe(takeUntilDestroyed()).subscribe((change) => this.hear(change));
    this.live.reconnected$.pipe(takeUntilDestroyed()).subscribe(() => this.reloadQuietly(null));
    this.destroyRef.onDestroy(() => this.quietRequest?.unsubscribe());
  }

  ngOnInit(): void {
    this.load(0, this.arrivedFromAnotherPage);
  }

  protected goTo(page: number): void {
    if (!this.loading()) {
      this.load(page, true);
    }
  }

  protected retry(): void {
    this.load(this.requestedPage, true, true);
  }

  private hear(change: OrderChange): void {
    const result = this.result();
    if (!result || this.loading()) {
      return;
    }
    const shown = result.items.find((order) => order.id === change.orderId);
    if (shown ? shown.status !== change.status : result.page === 0) {
      this.reloadQuietly(change);
    }
  }

  private reloadQuietly(change: OrderChange | null): void {
    if (this.loading() || this.problem() !== null) {
      return;
    }
    const focusWasInList = this.focusIsInList();
    this.quietRequest?.unsubscribe();
    this.quietRequest = this.orderApi.list(this.requestedPage, PAGE_SIZE).subscribe({
      next: (result) => {
        if (this.loading()) {
          return;
        }
        this.result.set(result);
        if (focusWasInList) {
          afterNextRender(
            () => {
              if (!this.focusIsInList()) {
                this.header()?.focus();
              }
            },
            { injector: this.injector },
          );
        }
        const changed = change && result.items.find((order) => order.id === change.orderId);
        if (changed) {
          this.announcer.announce(liveChangeMessage(changed));
        }
      },
    });
  }

  private load(page: number, moveFocus: boolean, retrying = false): void {
    this.quietRequest?.unsubscribe();
    this.requestedPage = page;
    this.retrying.set(retrying);
    this.loading.set(true);
    if (!retrying) {
      this.problem.set(null);
    }
    this.orderApi
      .list(page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.items.length === 0 && result.page > 0 && result.totalPages > 0) {
            this.load(result.totalPages - 1, moveFocus, retrying);
            return;
          }
          this.result.set(result);
          this.problem.set(null);
          this.loading.set(false);
          this.retrying.set(false);
          if (moveFocus) {
            this.focusHeading();
          }
        },
        error: (error: unknown) => {
          this.problem.set(describeOrderError(toProblemDetails(error)));
          this.loading.set(false);
          this.retrying.set(false);
          if (moveFocus) {
            this.focusRetry();
          }
        },
      });
  }

  private focusIsInList(): boolean {
    const list = this.orderList()?.nativeElement;
    return Boolean(list && document.activeElement && list.contains(document.activeElement));
  }

  private focusHeading(): void {
    afterNextRender(() => this.header()?.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
