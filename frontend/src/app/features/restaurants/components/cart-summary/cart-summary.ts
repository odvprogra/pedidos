import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { describeUnits } from '@core/cart/cart';
import { CART_PATH } from '@core/cart/cart-paths';
import { Button } from '@shared/ui/button/button';
import { formatPrice } from '@shared/utils/format-price';

@Component({
  selector: 'app-cart-summary',
  imports: [RouterLink, Button],
  templateUrl: './cart-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSummary {
  readonly units = input.required<number>();
  readonly subtotal = input.required<number>();

  protected readonly cartPath = CART_PATH;
  protected readonly subtotalLabel = computed(() => formatPrice(this.subtotal()));
  protected readonly readableLabel = computed(
    () => `Ver carrito: ${describeUnits(this.units())}, ${this.subtotalLabel()} estimado`,
  );
}
