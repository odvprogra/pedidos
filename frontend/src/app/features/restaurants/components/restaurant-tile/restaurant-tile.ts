import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { restaurantStatusLabel } from '@shared/utils/restaurant-status';
import { Restaurant, publicStatus } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-tile',
  imports: [RouterLink, RestaurantStatusBadge],
  templateUrl: './restaurant-tile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantTile {
  readonly restaurant = input.required<Restaurant>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly status = computed(() => publicStatus(this.restaurant()));
  protected readonly statusLabel = computed(() => restaurantStatusLabel(this.status()));
  protected readonly label = computed(() => `${this.restaurant().name}, ${this.statusLabel()}`);
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);
  protected readonly describedBy = computed(() => {
    const prefix = this.idPrefix();
    return this.restaurant().description
      ? `${prefix}-description ${prefix}-address`
      : `${prefix}-address`;
  });
}
