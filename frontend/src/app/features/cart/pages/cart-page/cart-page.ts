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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { LOG_IN_PATH, REGISTER_PATH } from '@core/auth/auth-paths';
import { SessionStore } from '@core/auth/session-store';
import { CART_PATH, CartItem, describeUnits } from '@core/cart/cart';
import { CartStore } from '@core/cart/cart-store';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Spinner } from '@shared/ui/spinner/spinner';
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
  imports: [RouterLink, Alert, Button, CartLine, EmptyState, OrderPlaced, SecondaryButton, Spinner],
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

  protected readonly logInPath = LOG_IN_PATH;
  protected readonly registerPath = REGISTER_PATH;
  protected readonly returnUrl = CART_PATH;
  protected readonly restaurant = this.cart.restaurant;
  protected readonly items = this.cart.items;
  protected readonly units = computed(() => describeUnits(this.cart.count()));
  protected readonly subtotal = computed(() => formatPrice(this.cart.subtotal()));
  protected readonly placing = signal(false);
  protected readonly failure = signal<Failure | null>(null);
  protected readonly placement = signal<Placement | null>(null);
  protected readonly buyer = computed<Buyer>(() => {
    const account = this.session.account();
    if (!account) {
      return 'guest';
    }
    return account.role === 'CUSTOMER' ? 'customer' : 'other';
  });

  constructor() {
    if (inject(Router).currentNavigation()?.previousNavigation) {
      afterNextRender(() => this.heading()?.nativeElement.focus());
    }
  }

  protected setQuantity(item: CartItem, quantity: number): void {
    this.failure.set(null);
    this.cart.setQuantity(item.productId, quantity);
  }

  protected remove(item: CartItem): void {
    this.failure.set(null);
    this.cart.remove(item.productId);
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
}
