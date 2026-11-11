import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ROLE_LABELS, Role, canShop } from '@core/auth/account';
import { ADMIN_PATH, LOG_IN_PATH, MY_RESTAURANT_PATH, REGISTER_PATH } from '@core/auth/auth-paths';
import { SessionStore } from '@core/auth/session-store';
import { describeUnits } from '@core/cart/cart';
import { CART_PATH } from '@core/cart/cart-paths';
import { CartStore } from '@core/cart/cart-store';
import { ORDERS_PATH } from '@core/orders/order-paths';

interface RoleLink {
  path: string;
  label: string;
  hiddenDetail: string | null;
  icon: 'panel' | 'store' | 'receipt';
}

const ROLE_LINKS: Record<Role, RoleLink> = {
  ADMIN: { path: ADMIN_PATH, label: 'Panel', hiddenDetail: 'de administración', icon: 'panel' },
  OWNER: { path: MY_RESTAURANT_PATH, label: 'Mi restaurante', hiddenDetail: null, icon: 'store' },
  CUSTOMER: { path: ORDERS_PATH, label: 'Mis pedidos', hiddenDetail: null, icon: 'receipt' },
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly cart = inject(CartStore);

  protected readonly logInPath = LOG_IN_PATH;
  protected readonly registerPath = REGISTER_PATH;
  protected readonly cartPath = CART_PATH;
  protected readonly status = this.session.status;
  protected readonly account = this.session.account;
  protected readonly showsCart = computed(
    () => this.status() !== 'loading' && canShop(this.account()),
  );
  protected readonly cartCount = this.cart.count;
  protected readonly cartBadge = computed(() =>
    this.cartCount() > 99 ? '99+' : String(this.cartCount()),
  );
  protected readonly cartLabel = computed(() =>
    this.cartCount() > 0 ? `Carrito: ${describeUnits(this.cartCount())}` : 'Carrito',
  );
  protected readonly roleLink = computed(() => {
    const account = this.account();
    return account ? ROLE_LINKS[account.role] : null;
  });
  protected readonly firstName = computed(() => this.account()?.name.trim().split(/\s+/)[0] ?? '');
  protected readonly initial = computed(() => this.firstName().charAt(0).toUpperCase());
  protected readonly roleLabel = computed(() => {
    const account = this.account();
    return account ? ROLE_LABELS[account.role] : '';
  });
  protected readonly loggingOut = signal(false);
  protected readonly logOutFailed = signal(false);

  protected logOut(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    this.logOutFailed.set(false);
    this.session.logOut().subscribe({
      next: () => {
        this.loggingOut.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loggingOut.set(false);
        this.logOutFailed.set(true);
      },
    });
  }
}
