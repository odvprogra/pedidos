import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoverImage } from '@shared/ui/cover-image/cover-image';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { RESTAURANT_CATEGORY_LABELS } from '@shared/utils/restaurant-category';
import { restaurantStatusLabel } from '@shared/utils/restaurant-status';
import { Restaurant, publicStatus } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-tile',
  imports: [RouterLink, CoverImage, RestaurantStatusBadge],
  templateUrl: './restaurant-tile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantTile {
  readonly restaurant = input.required<Restaurant>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly categoryLabel = computed(
    () => RESTAURANT_CATEGORY_LABELS[this.restaurant().category],
  );
  protected readonly status = computed(() => publicStatus(this.restaurant()));
  protected readonly statusLabel = computed(() => restaurantStatusLabel(this.status()));
  protected readonly label = computed(() => `${this.restaurant().name}, ${this.statusLabel()}`);
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);
  protected readonly describedBy = computed(() => {
    const prefix = this.idPrefix();
    return this.restaurant().description
      ? `${prefix}-category ${prefix}-description ${prefix}-address`
      : `${prefix}-category ${prefix}-address`;
  });
}
