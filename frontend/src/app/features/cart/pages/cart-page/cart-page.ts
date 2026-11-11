import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { canShop } from '@core/auth/account';
import { LOG_IN_PATH, REGISTER_PATH } from '@core/auth/auth-paths';
import { SessionStore } from '@core/auth/session-store';
import { CartItem } from '@core/cart/cart';
import { CART_PATH } from '@core/cart/cart-paths';
import { CartStore } from '@core/cart/cart-store';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Announce } from '@shared/ui/live-region/announce';
import { Spinner } from '@shared/ui/spinner/spinner';
import { describeUnits } from '@shared/utils/describe-units';
import { formatPrice } from '@shared/utils/format-price';
import { CartLine } from '../../components/cart-line/cart-line';
import { OrderPlaced } from '../../components/order-placed/order-placed';
import { OrderApi } from '../../data-access/order-api';
import { Order, orderRequestOf } from '../../models/order';
import { describeOrderError, isProductUnavailable } from '../../models/order-error';

type Buyer = 'guest' | 'customer' | 'other';

interface Failure {
  message: string;
  showsMenuLink: boolean;
}

interface Placement {
  order: Order;
  address: string;
}

const PLACED_TITLE = 'Pedido confirmado | Pedidos';

@Component({
  selector: 'app-cart-page',
  imports: [
    RouterLink,
    Alert,
    Announce,
    Button,
    CartLine,
    EmptyState,
    OrderPlaced,
    SecondaryButton,
    Spinner,
  ],
  templateUrl: './cart-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  private readonly cart = inject(CartStore);
  private readonly session = inject(SessionStore);
  private readonly orderApi = inject(OrderApi);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly orderPlaced = viewChild(OrderPlaced);
  private readonly lines = viewChildren(CartLine);

  protected readonly logInPath = LOG_IN_PATH;
  protected readonly registerPath = REGISTER_PATH;
  protected readonly returnUrl = CART_PATH;
  protected readonly restaurant = this.cart.restaurant;
  protected readonly items = this.cart.items;
  protected readonly units = this.cart.count;
  protected readonly subtotal = computed(() => formatPrice(this.cart.subtotal()));
  protected readonly placing = signal(false);
  protected readonly announcement = signal('');
  protected readonly failure = signal<Failure | null>(null);
  protected readonly placement = signal<Placement | null>(null);
  protected readonly buyer = computed<Buyer>(() => {
    const account = this.session.account();
    if (!account) {
      return 'guest';
    }
    return canShop(account) ? 'customer' : 'other';
  });

  constructor() {
    if (inject(Router).currentNavigation()?.previousNavigation) {
      afterNextRender(() => this.heading()?.nativeElement.focus());
    }
  }

  protected setQuantity(item: CartItem, quantity: number): void {
    this.failure.set(null);
    this.cart.setQuantity(item.productId, quantity);
    this.announcement.set(
      `${item.name}: ${describeQuantity(this.cart.quantityOf(item.productId))}. Total del carrito ${this.subtotal()}.`,
    );
  }

  protected remove(item: CartItem): void {
    const position = this.items().indexOf(item);
    this.failure.set(null);
    this.cart.remove(item.productId);
    this.announcement.set(
      this.cart.count() > 0
        ? `Quitaste ${item.name} del carrito. Tienes ${describeUnits(this.cart.count())}.`
        : `Quitaste ${item.name}. Tu carrito quedó vacío.`,
    );
    afterNextRender(() => this.focusAfterRemoving(position), { injector: this.injector });
  }

  protected empty(): void {
    this.cart.clear();
    this.announcement.set('Vaciaste el carrito.');
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  protected confirm(): void {
    const restaurant = this.restaurant();
    if (this.placing() || !restaurant || this.buyer() !== 'customer') {
      return;
    }
    this.placing.set(true);
    this.failure.set(null);
    this.orderApi
      .place(orderRequestOf(restaurant.id, this.items()))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.placing.set(false);
          this.cart.clear();
          this.placement.set({ order, address: restaurant.address });
          this.title.setTitle(PLACED_TITLE);
          afterNextRender(() => this.orderPlaced()?.focus(), { injector: this.injector });
        },
        error: (error: unknown) => {
          const problem = toProblemDetails(error);
          this.placing.set(false);
          this.failure.set({
            message: describeOrderError(problem, restaurant.name),
            showsMenuLink: isProductUnavailable(problem),
          });
        },
      });
  }

  private focusAfterRemoving(position: number): void {
    const remaining = this.lines();
    const next = remaining[Math.min(position, remaining.length - 1)];
    if (next) {
      next.focusRemoveButton();
    } else {
      this.heading()?.nativeElement.focus();
    }
  }
}

function describeQuantity(quantity: number): string {
  return quantity === 1 ? '1 unidad' : `${quantity} unidades`;
}
