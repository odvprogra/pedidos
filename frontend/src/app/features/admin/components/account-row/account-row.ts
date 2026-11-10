import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ROLE_LABELS } from '@core/auth/account';
import { Badge } from '@shared/ui/badge/badge';
import { actionFor, copyFor } from '../../models/account-action';
import { AccountSummary } from '../../models/account-summary';
import { ModerationAction } from '../../models/moderation-action';
import { ModerationControl } from '../moderation-control/moderation-control';

@Component({
  selector: 'app-account-row',
  imports: [Badge, ModerationControl],
  templateUrl: './account-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRow {
  readonly account = input.required<AccountSummary>();
  readonly isSelf = input(false);
  readonly busy = input(false);
  readonly locked = input(false);
  readonly confirmed = output<ModerationAction>();

  protected readonly moderation = computed(() => {
    const account = this.account();
    const action = actionFor(account);
    return action ? { action, copy: copyFor(action, account.name) } : null;
  });
  protected readonly roleLabel = computed(() => ROLE_LABELS[this.account().role]);
  protected readonly initial = computed(() => this.account().name.trim().charAt(0).toUpperCase());
  protected readonly confirmId = computed(() => `account-${this.account().id}-confirm`);
  protected readonly avatarStyle = computed(() => {
    const account = this.account();
    if (account.role === 'ADMIN') {
      return 'bg-accent text-ink';
    }
    return account.suspended ? 'bg-line text-muted' : 'bg-brand-soft text-brand';
  });
}
