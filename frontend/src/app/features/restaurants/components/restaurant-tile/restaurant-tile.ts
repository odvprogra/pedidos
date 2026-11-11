import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from '@shared/ui/badge/badge';
import { Restaurant, openingLabel, openingTone } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-tile',
  imports: [RouterLink, Badge],
  templateUrl: './restaurant-tile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantTile {
  readonly restaurant = input.required<Restaurant>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly statusLabel = computed(() => openingLabel(this.restaurant().open));
  protected readonly tone = computed(() => openingTone(this.restaurant().open));
  protected readonly label = computed(() => `${this.restaurant().name}, ${this.statusLabel()}`);
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);
  protected readonly describedBy = computed(() => {
    const prefix = this.idPrefix();
    return this.restaurant().description
      ? `${prefix}-description ${prefix}-address`
      : `${prefix}-address`;
  });
}
