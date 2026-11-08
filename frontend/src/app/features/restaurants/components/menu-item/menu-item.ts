import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge } from '@shared/ui/badge/badge';
import { formatPrice } from '@shared/utils/format-price';
import { Product } from '../../models/catalog';

@Component({
  selector: 'app-menu-item',
  imports: [Badge],
  templateUrl: './menu-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItem {
  readonly product = input.required<Product>();

  protected readonly price = computed(() => formatPrice(this.product().price));
  protected readonly nameId = computed(() => `menu-product-${this.product().id}-name`);
}
