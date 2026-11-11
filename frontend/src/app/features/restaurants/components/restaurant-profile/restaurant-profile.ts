import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { restaurantStatusLabel } from '@shared/utils/restaurant-status';
import { Restaurant, publicStatus } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-profile',
  imports: [RestaurantStatusBadge],
  templateUrl: './restaurant-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantProfile {
  private readonly name = viewChild.required<ElementRef<HTMLElement>>('name');

  readonly restaurant = input.required<Restaurant>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly status = computed(() => publicStatus(this.restaurant()));
  protected readonly statusLabel = computed(() => restaurantStatusLabel(this.status()));

  focus(): void {
    this.name().nativeElement.focus();
  }
}
