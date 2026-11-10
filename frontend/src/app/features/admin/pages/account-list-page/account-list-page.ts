import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { SessionStore } from '@core/auth/session-store';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { LoadError } from '@shared/ui/load-error/load-error';
import { CountPill } from '@shared/ui/page-header/count-pill';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { map } from 'rxjs';
import { AccountRow } from '../../components/account-row/account-row';
import { AccountApi } from '../../data-access/account-api';
import { ModerationList } from '../../data-access/moderation-list';
import { copyFor } from '../../models/account-action';
import { describeAccountError } from '../../models/account-error';
import { AccountSummary } from '../../models/account-summary';

@Component({
  selector: 'app-account-list-page',
  imports: [
    AccountRow,
    CountPill,
    EmptyState,
    LoadError,
    PageHeader,
    Pagination,
    Skeleton,
    StickyNotice,
  ],
  templateUrl: './account-list-page.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListPage implements OnInit {
  private readonly accountApi = inject(AccountApi);
  private readonly session = inject(SessionStore);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly list = new ModerationList<AccountSummary>({
    list: (page, size) => this.accountApi.list(page, size),
    apply: (action, account) =>
      this.accountApi
        .apply(action, account.id)
        .pipe(map(() => ({ ...account, suspended: action === 'suspend' }))),
    copyFor,
    describeError: describeAccountError,
    heading: () => this.header(),
    loadError: () => this.loadError(),
  });
  protected readonly ownId = computed(() => this.session.account()?.id);
  protected readonly totalLabel = computed(() => {
    const total = this.list.result()?.totalItems ?? 0;
    return total === 1 ? '1 cuenta' : `${total} cuentas`;
  });

  ngOnInit(): void {
    this.list.start();
  }
}
