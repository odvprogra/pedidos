import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { Spinner } from '@shared/ui/spinner/spinner';
import { Restaurant } from '../../models/restaurant';
import { openingHint, openingProgress } from '../../models/restaurant-status';

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, RestaurantStatusBadge, Spinner],
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly busy = input(false);
  readonly menuSummary = input<string | null>(null);
  readonly openChange = output<boolean>();

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
