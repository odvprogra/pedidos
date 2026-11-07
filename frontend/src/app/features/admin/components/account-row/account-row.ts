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
import { Spinner } from '@shared/ui/spinner/spinner';
import { AccountAction, actionFor, copyFor } from '../../models/account-action';
import { AccountSummary } from '../../models/account-summary';

interface ActionStyle {
  button: string;
  panel: string;
  confirm: string;
}

const ACTION_STYLES: Record<AccountAction, ActionStyle> = {
  suspend: {
    button:
      'border-brand/30 text-brand hover:bg-brand-soft focus-visible:outline-brand aria-expanded:bg-brand-soft',
    panel: 'bg-brand-soft',
    confirm: 'bg-brand shadow-brand/25 hover:bg-brand-strong focus-visible:outline-brand',
  },
  reactivate: {
    button:
      'border-success/30 text-success hover:bg-success-soft focus-visible:outline-success aria-expanded:bg-success-soft',
    panel: 'bg-success-soft',
    confirm: 'bg-success shadow-success/25 hover:bg-success/90 focus-visible:outline-success',
  },
};

@Component({
  selector: 'app-account-row',
  imports: [Spinner],
  templateUrl: './account-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRow {
  private readonly injector = inject(Injector);
  private readonly actionButton = viewChild<ElementRef<HTMLButtonElement>>('actionButton');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

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
  protected readonly style = computed(() => {
    const action = this.action();
    return action ? ACTION_STYLES[action] : null;
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
      this.focusAfterRender(this.cancelButton);
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
