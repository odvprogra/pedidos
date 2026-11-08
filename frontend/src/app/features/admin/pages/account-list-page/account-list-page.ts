import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SessionStore } from '@core/auth/session-store';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
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
  imports: [AccountRow, Alert, EmptyState, LoadError, Pagination],
  templateUrl: './account-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListPage implements OnInit {
  private readonly accountApi = inject(AccountApi);
  private readonly session = inject(SessionStore);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly loadError = viewChild(LoadError);
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
    this.load(0, false);
  }

  protected goTo(page: number): void {
    if (this.busy()) {
      return;
    }
    this.notice.set(null);
    this.load(page, true);
  }

  protected retry(): void {
    this.load(this.requestedPage, true);
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

  private load(page: number, moveFocus: boolean): void {
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    this.accountApi.list(page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
        if (moveFocus) {
          this.focusHeading();
        }
      },
      error: (error: unknown) => {
        this.problem.set(describeAccountError(toProblemDetails(error)));
        this.loading.set(false);
        if (moveFocus) {
          this.focusRetry();
        }
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

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
