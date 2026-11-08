import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Spinner } from '@shared/ui/spinner/spinner';
import { Restaurant } from '../../models/restaurant';
import {
  RestaurantStatus,
  STATUS_LABELS,
  openingHint,
  openingProgress,
  statusOf,
} from '../../models/restaurant-status';

const BADGE_STYLES: Record<RestaurantStatus, string> = {
  open: 'bg-success-soft text-success',
  closed: 'bg-line text-ink',
  suspended: 'bg-danger-soft text-danger',
};

@Component({
  selector: 'app-restaurant-card',
  imports: [Spinner],
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly busy = input(false);
  readonly openChange = output<boolean>();

  protected readonly status = computed(() => statusOf(this.restaurant()));
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly badgeStyle = computed(() => BADGE_STYLES[this.status()]);
  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly hint = computed(() => {
    const open = this.restaurant().open;
    return this.busy() ? openingProgress(!open) : openingHint(open);
  });
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);

  protected toggle(): void {
    if (this.busy()) {
      return;
    }
    this.openChange.emit(!this.restaurant().open);
  }
}
