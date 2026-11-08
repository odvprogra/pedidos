import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CartItem, MAX_QUANTITY, lineSubtotal } from '@core/cart/cart';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { formatPrice } from '@shared/utils/format-price';

@Component({
  selector: 'app-cart-line',
  imports: [SecondaryButton],
  templateUrl: './cart-line.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartLine {
  readonly item = input.required<CartItem>();
  readonly locked = input(false);
  readonly quantityChange = output<number>();
  readonly removed = output();

  protected readonly nameId = computed(() => `cart-line-${this.item().productId}-name`);
  protected readonly unitPrice = computed(() => formatPrice(this.item().price));
  protected readonly subtotal = computed(() => formatPrice(lineSubtotal(this.item())));
  protected readonly atMinimum = computed(() => this.item().quantity <= 1);
  protected readonly atMaximum = computed(() => this.item().quantity >= MAX_QUANTITY);

  protected decrease(): void {
    if (!this.locked() && !this.atMinimum()) {
      this.quantityChange.emit(this.item().quantity - 1);
    }
  }

  protected increase(): void {
    if (!this.locked() && !this.atMaximum()) {
      this.quantityChange.emit(this.item().quantity + 1);
    }
  }

  protected remove(): void {
    if (!this.locked()) {
      this.removed.emit();
    }
  }
}
