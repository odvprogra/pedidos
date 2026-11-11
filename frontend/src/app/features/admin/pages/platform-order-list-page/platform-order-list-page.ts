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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Announce } from '@shared/ui/live-region/announce';
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { PlatformOrderRow } from '../../components/platform-order-row/platform-order-row';
import { PlatformOrderApi } from '../../data-access/platform-order-api';
import {
  PlatformOrder,
  countPlatformOrders,
  describePlatformOrderError,
} from '../../models/platform-order';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-platform-order-list-page',
  imports: [
    Announce,
    CountPill,
    EmptyState,
    LoadError,
    PageHeader,
    Pagination,
    PlatformOrderRow,
    Skeleton,
  ],
  templateUrl: './platform-order-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformOrderListPage implements OnInit {
  private readonly orderApi = inject(PlatformOrderApi);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private requestedPage = 0;

  protected readonly placeholders = [1, 2, 3];
  protected readonly result = signal<Page<PlatformOrder> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly retrying = signal(false);
  protected readonly totalLabel = computed(() =>
    countPlatformOrders(this.result()?.totalItems ?? 0),
  );

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

  private load(page: number, moveFocus: boolean, retrying = false): void {
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
            afterNextRender(() => this.header()?.focus(), { injector: this.injector });
          }
        },
        error: (error: unknown) => {
          this.problem.set(describePlatformOrderError(toProblemDetails(error)));
          this.loading.set(false);
          this.retrying.set(false);
          if (moveFocus) {
            afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
          }
        },
      });
  }
}
