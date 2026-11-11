import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { Badge } from '@shared/ui/badge/badge';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { Spinner } from '@shared/ui/spinner/spinner';
import { formatPrice } from '@shared/utils/format-price';
import { Product } from '../../models/catalog';

export type ProductTask = 'availability' | 'deletion';

@Component({
  selector: 'app-product-row',
  imports: [Badge, ConfirmPanel, SecondaryButton, Spinner],
  templateUrl: './product-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRow {
  private readonly injector = inject(Injector);
  private readonly deleteButton = viewChild<ElementRef<HTMLButtonElement>>('deleteButton');

  readonly product = input.required<Product>();
  readonly working = input<ProductTask | null>(null);
  readonly locked = input(false);
  readonly confirming = model(false);
  readonly availabilityChange = output<boolean>();
  readonly edit = output();
  readonly deleteConfirmed = output();

  protected readonly unavailable = computed(() => this.working() !== null || this.locked());
  protected readonly price = computed(() => formatPrice(this.product().price));
  protected readonly idPrefix = computed(() => `product-${this.product().id}`);
  protected readonly progress = computed(() => {
    if (this.working() !== 'availability') {
      return null;
    }
    return this.product().available ? 'Marcando como agotado…' : 'Marcando como disponible…';
  });
  protected readonly switchCursor = computed(() =>
    this.working() === 'availability'
      ? 'aria-disabled:cursor-wait'
      : 'aria-disabled:cursor-not-allowed',
  );

  protected toggleAvailability(): void {
    if (!this.unavailable()) {
      this.availabilityChange.emit(!this.product().available);
    }
  }

  protected requestEdit(): void {
    if (!this.unavailable()) {
      this.edit.emit();
    }
  }

  protected toggleConfirmation(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    } else if (!this.unavailable()) {
      this.confirming.set(true);
    }
  }

  protected dismiss(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    }
  }

  protected closeConfirmation(): void {
    this.confirming.set(false);
    this.focusDeleteButton();
  }

  protected confirmDeletion(): void {
    if (this.unavailable()) {
      return;
    }
    this.confirming.set(false);
    this.deleteConfirmed.emit();
    this.focusDeleteButton();
  }

  private focusDeleteButton(): void {
    afterNextRender(() => this.deleteButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
