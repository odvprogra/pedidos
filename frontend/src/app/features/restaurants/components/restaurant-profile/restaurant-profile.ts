import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { Badge } from '@shared/ui/badge/badge';
import { Restaurant, openingLabel } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-profile',
  imports: [Badge],
  templateUrl: './restaurant-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantProfile {
  private readonly name = viewChild.required<ElementRef<HTMLElement>>('name');

  readonly restaurant = input.required<Restaurant>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly statusLabel = computed(() => openingLabel(this.restaurant().open));

  focus(): void {
    this.name().nativeElement.focus();
  }
}
