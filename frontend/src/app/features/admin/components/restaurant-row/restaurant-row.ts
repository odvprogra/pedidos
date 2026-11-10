import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { ModerationAction } from '../../models/moderation-action';
import { actionFor, copyFor } from '../../models/restaurant-action';
import { RestaurantSummary } from '../../models/restaurant-summary';
import { ModerationControl } from '../moderation-control/moderation-control';

@Component({
  selector: 'app-restaurant-row',
  imports: [ModerationControl, RestaurantStatusBadge],
  templateUrl: './restaurant-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantRow {
  readonly restaurant = input.required<RestaurantSummary>();
  readonly busy = input(false);
  readonly locked = input(false);
  readonly confirming = model(false);
  readonly confirmed = output<ModerationAction>();

  protected readonly action = computed(() => actionFor(this.restaurant()));
  protected readonly copy = computed(() => copyFor(this.action(), this.restaurant().name));
  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly confirmId = computed(() => `restaurant-${this.restaurant().id}-confirm`);
  protected readonly avatarStyle = computed(() =>
    this.restaurant().suspended ? 'bg-line text-muted' : 'bg-accent text-ink',
  );
}
