import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SecondaryButton, SecondaryButtonTone } from '@shared/ui/button/secondary-button';
import { ConfirmPanel, ConfirmTone } from '@shared/ui/confirm-panel/confirm-panel';
import { Spinner } from '@shared/ui/spinner/spinner';
import { ModerationAction, ModerationCopy } from '../../models/moderation-action';

interface ActionTones {
  button: SecondaryButtonTone;
  panel: ConfirmTone;
}

const ACTION_TONES: Record<ModerationAction, ActionTones> = {
  suspend: { button: 'danger', panel: 'brand' },
  reactivate: { button: 'success', panel: 'success' },
};

@Component({
  selector: 'app-moderation-control',
  imports: [ConfirmPanel, SecondaryButton, Spinner],
  templateUrl: './moderation-control.html',
  host: { class: 'contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationControl {
  private readonly injector = inject(Injector);
  private readonly actionButton = viewChild<ElementRef<HTMLButtonElement>>('actionButton');

  readonly action = input.required<ModerationAction>();
  readonly copy = input.required<ModerationCopy>();
  readonly panelId = input.required<string>();
  readonly busy = input(false);
  readonly locked = input(false);
  readonly confirmed = output<ModerationAction>();

  protected readonly confirming = signal(false);
  protected readonly tones = computed(() => ACTION_TONES[this.action()]);
  protected readonly unavailable = computed(() => this.busy() || this.locked());

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
    this.focusActionButton();
  }

  protected confirm(): void {
    if (this.unavailable()) {
      return;
    }
    this.confirming.set(false);
    this.confirmed.emit(this.action());
    this.focusActionButton();
  }

  private focusActionButton(): void {
    afterNextRender(() => this.actionButton()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
