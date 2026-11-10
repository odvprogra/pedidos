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
import { Router } from '@angular/router';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { Pagination } from '@shared/ui/pagination/pagination';
import { RestaurantRow } from '../../components/restaurant-row/restaurant-row';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { ModerationAction } from '../../models/moderation-action';
import { copyFor } from '../../models/restaurant-action';
import { describeRestaurantError } from '../../models/restaurant-error';
import { RestaurantSummary } from '../../models/restaurant-summary';

const PAGE_SIZE = 20;

interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

@Component({
  selector: 'app-restaurant-list-page',
  imports: [Alert, EmptyState, LoadError, Pagination, RestaurantRow],
  templateUrl: './restaurant-list-page.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantListPage implements OnInit {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private requestedPage = 0;
  private noticeCount = 0;

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly result = signal<Page<RestaurantSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly notices = computed(() => {
    const current = this.notice();
    return current ? [current] : [];
  });
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
    this.notice.set(null);
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
    this.notice.set(null);
    this.restaurantApi
      .apply(action, restaurant.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.announce('success', copyFor(action, updated.name).done);
          this.pendingId.set(null);
        },
        error: (error: unknown) => {
          this.announce('danger', describeRestaurantError(toProblemDetails(error)));
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

  private announce(tone: AlertTone, message: string): void {
    this.noticeCount += 1;
    this.notice.set({ id: this.noticeCount, tone, message });
  }

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
