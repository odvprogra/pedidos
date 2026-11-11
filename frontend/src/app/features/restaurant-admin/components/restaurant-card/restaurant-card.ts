import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { CoverImage } from '@shared/ui/cover-image/cover-image';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { Spinner } from '@shared/ui/spinner/spinner';
import { RESTAURANT_CATEGORY_LABELS } from '@shared/utils/restaurant-category';
import { Restaurant } from '../../models/restaurant';
import { openingHint, openingProgress } from '../../models/restaurant-status';

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, CoverImage, RestaurantStatusBadge, SecondaryButton, Spinner],
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly busy = input(false);
  readonly menuSummary = input<string | null>(null);
  readonly openChange = output<boolean>();
  readonly editRequested = output<void>();

  private readonly editButton = viewChild.required<ElementRef<HTMLButtonElement>>('editButton');

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly categoryLabel = computed(
    () => RESTAURANT_CATEGORY_LABELS[this.restaurant().category],
  );
  protected readonly hint = computed(() => {
    const open = this.restaurant().open;
    return this.busy() ? openingProgress(!open) : openingHint(open);
  });
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);

  focusEdit(): void {
    this.editButton().nativeElement.focus();
  }

  protected toggle(): void {
    if (this.busy()) {
      return;
    }
    this.openChange.emit(!this.restaurant().open);
  }
}
