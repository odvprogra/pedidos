import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  RESTAURANT_STATUS_LABELS,
  RestaurantState,
  RestaurantStatus,
  restaurantStatusOf,
} from '../../utils/restaurant-status';
import { Badge, BadgeSize, BadgeTone } from '../badge/badge';

const TONES: Record<RestaurantStatus, BadgeTone> = {
  open: 'success',
  closed: 'neutral',
  suspended: 'danger',
};

@Component({
  selector: 'app-restaurant-status-badge',
  imports: [Badge],
  templateUrl: './restaurant-status-badge.html',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantStatusBadge {
  readonly restaurant = input.required<RestaurantState>();
  readonly size = input<BadgeSize>('md');

  private readonly status = computed(() => restaurantStatusOf(this.restaurant()));
  protected readonly label = computed(() => RESTAURANT_STATUS_LABELS[this.status()]);
  protected readonly tone = computed(() => TONES[this.status()]);
}
