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
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { RestaurantRow } from '../../components/restaurant-row/restaurant-row';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { ModerationAction } from '../../models/moderation-action';
import { copyFor } from '../../models/restaurant-action';
import { describeRestaurantError } from '../../models/restaurant-error';
import { RestaurantSummary } from '../../models/restaurant-summary';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-restaurant-list-page',
  imports: [
    CountPill,
    EmptyState,
    LoadError,
    PageHeader,
    Pagination,
    RestaurantRow,
    Skeleton,
    StickyNotice,
  ],
  templateUrl: './restaurant-list-page.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantListPage implements OnInit {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private requestedPage = 0;

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly result = signal<Page<RestaurantSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly notice = new NoticeSlot();
  protected readonly busy = computed(() => this.loading() || this.pendingId() !== null);
  protected readonly totalLabel = computed(() => {
    const total = this.result()?.totalItems ?? 0;
    return total === 1 ? '1 restaurante' : `${total} restaurantes`;
  });

  ngOnInit(): void {
    this.load(0, this.arrivedFromAnotherPage);
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

  protected run(action: ModerationAction, restaurant: RestaurantSummary): void {
    if (this.busy()) {
      return;
    }
    this.pendingId.set(restaurant.id);
    this.notice.clear();
    this.restaurantApi
      .apply(action, restaurant.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.notice.show('success', copyFor(action, updated.name).done);
          this.pendingId.set(null);
        },
        error: (error: unknown) => {
          this.notice.show('danger', describeRestaurantError(toProblemDetails(error)));
          this.pendingId.set(null);
        },
      });
  }

  private load(page: number, moveFocus: boolean): void {
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    this.restaurantApi
      .list(page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
          if (moveFocus) {
            this.focusHeading();
          }
        },
        error: (error: unknown) => {
          this.problem.set(describeRestaurantError(toProblemDetails(error)));
          this.loading.set(false);
          if (moveFocus) {
            this.focusRetry();
          }
        },
      });
  }

  private replace(updated: RestaurantSummary): void {
    this.result.update(
      (result) =>
        result && {
          ...result,
          items: result.items.map((item) => (item.id === updated.id ? updated : item)),
        },
    );
  }

  private focusHeading(): void {
    afterNextRender(() => this.header()?.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
