import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SessionStore } from '@core/auth/session-store';
import { Page } from '@core/http/page';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { AccountRow } from '../../components/account-row/account-row';
import { AccountApi } from '../../data-access/account-api';
import { copyFor } from '../../models/account-action';
import { describeAccountError } from '../../models/account-error';
import { AccountSummary } from '../../models/account-summary';
import { ModerationAction } from '../../models/moderation-action';

const PAGE_SIZE = 20;

interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

@Component({
  selector: 'app-account-list-page',
  imports: [AccountRow, Alert, CountPill, EmptyState, LoadError, PageHeader, Pagination, Skeleton],
  templateUrl: './account-list-page.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListPage implements OnInit {
  private readonly accountApi = inject(AccountApi);
  private readonly session = inject(SessionStore);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private requestedPage = 0;
  private noticeCount = 0;

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly result = signal<Page<AccountSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly problem = signal<string | null>(null);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly notices = computed(() => {
    const current = this.notice();
    return current ? [current] : [];
  });
  protected readonly ownId = computed(() => this.session.account()?.id);
  protected readonly busy = computed(() => this.loading() || this.pendingId() !== null);
  protected readonly totalLabel = computed(() => {
    const total = this.result()?.totalItems ?? 0;
    return total === 1 ? '1 cuenta' : `${total} cuentas`;
  });

  ngOnInit(): void {
    this.load(0, this.arrivedFromAnotherPage);
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

  protected run(action: ModerationAction, account: AccountSummary): void {
    if (this.busy()) {
      return;
    }
    this.pendingId.set(account.id);
    this.notice.set(null);
    this.accountApi
      .apply(action, account.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.replace({ ...account, suspended: action === 'suspend' });
          this.announce('success', copyFor(action, account.name).done);
          this.pendingId.set(null);
        },
        error: (error: unknown) => {
          this.announce('danger', describeAccountError(toProblemDetails(error)));
          this.pendingId.set(null);
        },
      });
  }

  private load(page: number, moveFocus: boolean): void {
    this.requestedPage = page;
    this.loading.set(true);
    this.problem.set(null);
    this.accountApi
      .list(page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  private announce(tone: AlertTone, message: string): void {
    this.noticeCount += 1;
    this.notice.set({ id: this.noticeCount, tone, message });
  }

  private focusHeading(): void {
    afterNextRender(() => this.header()?.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
