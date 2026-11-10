import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { canShop } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { CartStore } from '@core/cart/cart-store';
import { toProblemDetails } from '@core/http/problem-details';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { LoadError } from '@shared/ui/load-error/load-error';
import { describeUnits } from '@shared/utils/describe-units';
import { parseId } from '@shared/utils/parse-id';
import { Subscription, forkJoin } from 'rxjs';
import { CartSummary } from '../../components/cart-summary/cart-summary';
import { MenuItem } from '../../components/menu-item/menu-item';
import { RestaurantProfile } from '../../components/restaurant-profile/restaurant-profile';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { Catalog, Product } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import { isRestaurantMissing } from '../../models/restaurant-error';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; restaurant: Restaurant; catalog: Catalog };

const MENU_TITLE = 'Menú | Pedidos';
const MISSING_TITLE = 'Restaurante no encontrado | Pedidos';

@Component({
  selector: 'app-restaurant-menu-page',
  imports: [
    RouterLink,
    Button,
    CartSummary,
    EmptyState,
    LoadError,
    MenuItem,
    RestaurantProfile,
    SecondaryButton,
  ],
  templateUrl: './restaurant-menu-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantMenuPage {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly cart = inject(CartStore);
  private readonly session = inject(SessionStore);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly profile = viewChild(RestaurantProfile);
  private readonly missingHeading = viewChild<ElementRef<HTMLElement>>('missingHeading');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private loads = 0;

  readonly id = input.required<string>();

  protected readonly placeholders = [1, 2];
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly announcement = signal('');
  protected readonly canOrder = computed(() => canShop(this.session.account()));
  protected readonly otherRestaurant = computed(() => {
    const inCart = this.cart.restaurant();
    const shown = this.shownRestaurant();
    return inCart && shown && inCart.id !== shown.id ? inCart.name : null;
  });
  protected readonly cartHere = computed(() => {
    const shown = this.shownRestaurant();
    if (!this.canOrder() || !shown || this.cart.restaurant()?.id !== shown.id) {
      return null;
    }
    return { units: this.cart.count(), subtotal: this.cart.subtotal() };
  });

  private readonly shownRestaurant = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.restaurant : null;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id, this.loads > 0 || this.arrivedFromAnotherPage));
    });
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  protected retry(): void {
    this.load(this.id(), true);
  }

  protected quantityOf(product: Product): number {
    return this.cart.quantityOf(product.id);
  }

  protected add(restaurant: Restaurant, product: Product): void {
    if (this.cart.add(restaurant, product) === 'added') {
      this.announceAdded(product);
    }
  }

  protected replace(restaurant: Restaurant, product: Product): void {
    const previous = this.cart.restaurant()?.name;
    this.cart.replaceWith(restaurant, product);
    this.announcement.set(
      `Vaciaste el carrito de ${previous} y agregaste ${product.name}. Tienes ${describeUnits(this.cart.count())}.`,
    );
  }

  private announceAdded(product: Product): void {
    this.announcement.set(
      `Agregaste ${product.name} al carrito. Tienes ${describeUnits(this.cart.count())}.`,
    );
  }

  private load(idText: string, moveFocus: boolean): void {
    this.loads += 1;
    this.request?.unsubscribe();
    const id = parseId(idText);
    if (id === null) {
      this.show({ status: 'missing' }, moveFocus);
      return;
    }
    this.state.set({ status: 'loading' });
    this.request = forkJoin({
      restaurant: this.restaurantApi.get(id),
      catalog: this.restaurantApi.catalog(id),
    }).subscribe({
      next: ({ restaurant, catalog }) =>
        this.show({ status: 'ready', restaurant, catalog }, moveFocus),
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        this.show(
          isRestaurantMissing(problem)
            ? { status: 'missing' }
            : { status: 'failed', message: problem.detail },
          moveFocus,
        );
      },
    });
  }

  private show(state: PageState, moveFocus: boolean): void {
    this.state.set(state);
    this.title.setTitle(this.titleOf(state));
    if (moveFocus) {
      afterNextRender(() => this.focus(state), { injector: this.injector });
    }
  }

  private titleOf(state: PageState): string {
    if (state.status === 'ready') {
      return `${state.restaurant.name} | Pedidos`;
    }
    return state.status === 'missing' ? MISSING_TITLE : MENU_TITLE;
  }

  private focus(state: PageState): void {
    if (state.status === 'ready') {
      this.profile()?.focus();
    } else if (state.status === 'missing') {
      this.missingHeading()?.nativeElement.focus();
    } else {
      this.loadError()?.focus();
    }
  }
}
