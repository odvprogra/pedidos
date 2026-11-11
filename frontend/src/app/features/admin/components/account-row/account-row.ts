import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  Signal,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ROLE_LABELS } from '@core/auth/account';
import { Badge } from '@shared/ui/badge/badge';
import { SecondaryButton, SecondaryButtonTone } from '@shared/ui/button/secondary-button';
import { ConfirmPanel, ConfirmTone } from '@shared/ui/confirm-panel/confirm-panel';
import { Spinner } from '@shared/ui/spinner/spinner';
import { AccountAction, actionFor, copyFor } from '../../models/account-action';
import { AccountSummary } from '../../models/account-summary';

interface ActionTones {
  button: SecondaryButtonTone;
  panel: ConfirmTone;
}

const ACTION_TONES: Record<AccountAction, ActionTones> = {
  suspend: { button: 'danger', panel: 'brand' },
  reactivate: { button: 'success', panel: 'success' },
};

@Component({
  selector: 'app-account-row',
  imports: [Badge, ConfirmPanel, SecondaryButton, Spinner],
  templateUrl: './account-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRow {
  private readonly injector = inject(Injector);
  private readonly actionButton = viewChild<ElementRef<HTMLButtonElement>>('actionButton');

  readonly account = input.required<AccountSummary>();
  readonly isSelf = input(false);
  readonly busy = input(false);
  readonly locked = input(false);
  readonly confirmed = output<AccountAction>();

  protected readonly confirming = signal(false);
  protected readonly action = computed(() => actionFor(this.account()));
  protected readonly copy = computed(() => {
    const action = this.action();
    return action ? copyFor(action, this.account().name) : null;
  });
  protected readonly tones = computed(() => {
    const action = this.action();
    return action ? ACTION_TONES[action] : null;
  });
  protected readonly unavailable = computed(() => this.busy() || this.locked());
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

  protected toggle(): void {
    if (this.confirming()) {
      this.cancel();
    } else if (!this.unavailable()) {
      this.confirming.set(true);
    }
  }

  protected dismiss(): void {
    if (this.confirming()) {
      this.cancel();
    }
  }

  protected cancel(): void {
    this.confirming.set(false);
    this.focusAfterRender(this.actionButton);
  }

  protected confirm(): void {
    const action = this.action();
    if (!action || this.unavailable()) {
      return;
    }
    this.confirming.set(false);
    this.confirmed.emit(action);
    this.focusAfterRender(this.actionButton);
  }

  private focusAfterRender(target: Signal<ElementRef<HTMLButtonElement> | undefined>): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
