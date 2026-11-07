import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SessionStore } from '@core/auth/session-store';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { Pagination } from '@shared/ui/pagination/pagination';
import { AccountRow } from '../../components/account-row/account-row';
import { AccountApi } from '../../data-access/account-api';
import { AccountAction, copyFor } from '../../models/account-action';
import { describeAccountError } from '../../models/account-error';
import { AccountSummary } from '../../models/account-summary';

const PAGE_SIZE = 20;

interface Notice {
  tone: AlertTone;
  message: string;
}

@Component({
  selector: 'app-account-list-page',
  imports: [AccountRow, Alert, Button, Pagination],
  templateUrl: './account-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListPage implements OnInit {
  private readonly accountApi = inject(AccountApi);
  private readonly session = inject(SessionStore);
  private requestedPage = 0;

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly result = signal<Page<AccountSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly ownId = computed(() => this.session.account()?.id);
  protected readonly busy = computed(() => this.loading() || this.pendingId() !== null);
  protected readonly totalLabel = computed(() => {
    const total = this.result()?.totalItems ?? 0;
    return total === 1 ? '1 cuenta' : `${total} cuentas`;
  });

  ngOnInit(): void {
    this.load(0);
  }

  protected goTo(page: number): void {
    if (this.busy()) {
      return;
    }
    this.notice.set(null);
    this.load(page);
  }

  protected retry(): void {
    this.load(this.requestedPage);
  }

  protected run(action: AccountAction, account: AccountSummary): void {
    if (this.busy()) {
      return;
    }
    this.pendingId.set(account.id);
    this.notice.set(null);
    this.accountApi.apply(action, account.id).subscribe({
      next: () => {
        this.replace({ ...account, suspended: action === 'suspend' });
        this.notice.set({ tone: 'success', message: copyFor(action, account.name).done });
        this.pendingId.set(null);
      },
      error: (error: unknown) => {
        this.notice.set({ tone: 'danger', message: describeAccountError(toProblemDetails(error)) });
        this.pendingId.set(null);
      },
    });
  }

  private load(page: number): void {
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    this.accountApi.list(page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.problem.set(describeAccountError(toProblemDetails(error)));
        this.loading.set(false);
      },
    });
  }

  private replace(updated: AccountSummary): void {
    this.result.update(
      (result) =>
        result && {
          ...result,
          items: result.items.map((item) => (item.id === updated.id ? updated : item)),
        },
    );
  }
}
