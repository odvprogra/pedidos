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
import { MAX_QUANTITY } from '@core/cart/cart';
import { Badge } from '@shared/ui/badge/badge';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { formatPrice } from '@shared/utils/format-price';
import { Product } from '../../models/catalog';

@Component({
  selector: 'app-menu-item',
  imports: [Badge, ConfirmPanel],
  templateUrl: './menu-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItem {
  private readonly injector = inject(Injector);
  private readonly addButton = viewChild<ElementRef<HTMLButtonElement>>('addButton');

  readonly product = input.required<Product>();
  readonly canOrder = input(false);
  readonly restaurantOpen = input(true);
  readonly quantityInCart = input(0);
  readonly otherRestaurant = input<string | null>(null);
  readonly confirming = model(false);
  readonly added = output();
  readonly replaced = output();

  protected readonly price = computed(() => formatPrice(this.product().price));
  protected readonly idPrefix = computed(() => `menu-product-${this.product().id}`);
  protected readonly nameId = computed(() => `${this.idPrefix()}-name`);
  protected readonly inCartId = computed(() => `${this.idPrefix()}-in-cart`);
  protected readonly atMaximum = computed(() => this.quantityInCart() >= MAX_QUANTITY);
  protected readonly orderable = computed(() => this.product().available && this.restaurantOpen());
  protected readonly addable = computed(() => this.orderable() && !this.atMaximum());
  protected readonly replacementQuestion = computed(
    () => `¿Vaciar tu carrito de ${this.otherRestaurant()}?`,
  );
  protected readonly replacementConsequence = computed(
    () =>
      `Tu carrito solo puede tener productos de un restaurante. Si agregas ${this.product().name}, se quitan los de ${this.otherRestaurant()}.`,
  );

  protected add(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    } else if (this.addable() && this.otherRestaurant()) {
      this.confirming.set(true);
    } else if (this.addable()) {
      this.added.emit();
    }
  }

  protected dismiss(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    }
  }

  protected closeConfirmation(): void {
    this.confirming.set(false);
    this.focusAddButton();
  }

  protected replace(): void {
    this.confirming.set(false);
    this.replaced.emit();
    this.focusAddButton();
  }

  private focusAddButton(): void {
    afterNextRender(() => this.addButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
