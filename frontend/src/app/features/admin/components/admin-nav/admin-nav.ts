import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ADMIN_PATH } from '@core/auth/auth-paths';

interface AdminSection {
  label: string;
  path: string;
  exact: boolean;
  icon: 'accounts' | 'restaurants' | 'orders';
}

@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNav {
  protected readonly sections: AdminSection[] = [
    { label: 'Cuentas', path: ADMIN_PATH, exact: true, icon: 'accounts' },
    {
      label: 'Restaurantes',
      path: `${ADMIN_PATH}/restaurantes`,
      exact: false,
      icon: 'restaurants',
    },
    { label: 'Pedidos', path: `${ADMIN_PATH}/pedidos`, exact: false, icon: 'orders' },
  ];
}
