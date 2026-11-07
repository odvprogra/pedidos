import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Role } from '@core/auth/account';
import { LOG_IN_PATH, REGISTER_PATH } from '@core/auth/auth-paths';
import { SessionStore } from '@core/auth/session-store';

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Cliente',
  OWNER: 'Dueño de restaurante',
  ADMIN: 'Administrador',
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

  protected readonly logInPath = LOG_IN_PATH;
  protected readonly registerPath = REGISTER_PATH;
  protected readonly status = this.session.status;
  protected readonly account = this.session.account;
  protected readonly firstName = computed(() => this.account()?.name.trim().split(/\s+/)[0] ?? '');
  protected readonly initial = computed(() => this.firstName().charAt(0).toUpperCase());
  protected readonly roleLabel = computed(() => {
    const account = this.account();
    return account ? ROLE_LABELS[account.role] : '';
  });
  protected readonly loggingOut = signal(false);
  protected readonly logOutFailed = signal(false);

  protected logOut(): void {
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
