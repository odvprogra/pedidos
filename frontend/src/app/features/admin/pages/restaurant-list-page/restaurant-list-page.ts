import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { RestaurantRow } from '../../components/restaurant-row/restaurant-row';
import { ModerationList } from '../../data-access/moderation-list';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { copyFor } from '../../models/restaurant-action';
import { describeRestaurantError } from '../../models/restaurant-error';
import { RestaurantSummary } from '../../models/restaurant-summary';

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
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly list = new ModerationList<RestaurantSummary>({
    list: (page, size) => this.restaurantApi.list(page, size),
    apply: (action, restaurant) => this.restaurantApi.apply(action, restaurant.id),
    copyFor,
    describeError: describeRestaurantError,
    heading: () => this.header(),
    loadError: () => this.loadError(),
  });
  protected readonly totalLabel = computed(() => {
    const total = this.list.result()?.totalItems ?? 0;
    return total === 1 ? '1 restaurante' : `${total} restaurantes`;
  });

  ngOnInit(): void {
    this.list.start();
  }
}
