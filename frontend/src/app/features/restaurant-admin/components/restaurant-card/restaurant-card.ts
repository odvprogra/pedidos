import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge, BadgeTone } from '@shared/ui/badge/badge';
import { Spinner } from '@shared/ui/spinner/spinner';
import { Restaurant } from '../../models/restaurant';
import {
  RestaurantStatus,
  STATUS_LABELS,
  openingHint,
  openingProgress,
  statusOf,
} from '../../models/restaurant-status';

const BADGE_TONES: Record<RestaurantStatus, BadgeTone> = {
  open: 'success',
  closed: 'neutral',
  suspended: 'danger',
};

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, Badge, Spinner],
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly busy = input(false);
  readonly menuSummary = input<string | null>(null);
  readonly openChange = output<boolean>();

  protected readonly status = computed(() => statusOf(this.restaurant()));
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly badgeTone = computed(() => BADGE_TONES[this.status()]);
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
