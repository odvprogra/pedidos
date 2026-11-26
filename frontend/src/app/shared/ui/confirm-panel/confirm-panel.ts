import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SecondaryButton } from '../button/secondary-button';

export type ConfirmTone = 'brand' | 'success' | 'warning';

const STYLES: Record<ConfirmTone, { panel: string; confirm: string }> = {
  brand: {
    panel: 'bg-brand-soft',
    confirm:
      'bg-brand shadow-brand/25 hover:bg-brand-strong focus-visible:outline-brand aria-disabled:hover:bg-brand',
  },
  success: {
    panel: 'bg-success-soft',
    confirm:
      'bg-success shadow-success/25 hover:bg-success/90 focus-visible:outline-success aria-disabled:hover:bg-success',
  },
  warning: {
    panel: 'bg-warning-soft',
    confirm:
      'bg-warning shadow-warning/25 hover:bg-warning/90 focus-visible:outline-warning aria-disabled:hover:bg-warning',
  },
};

@Component({
  selector: 'app-confirm-panel',
  host: { class: '@container block' },
  imports: [SecondaryButton],
  templateUrl: './confirm-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmPanel {
  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');

  readonly panelId = input.required<string>();
  readonly question = input.required<string>();
  readonly consequence = input.required<string>();
  readonly confirmLabel = input<string | null>(null);
  readonly cancelLabel = input('Cancelar');
  readonly tone = input<ConfirmTone>('brand');
  readonly disabled = input(false);
  readonly confirmed = output();
  readonly cancelled = output();

  protected readonly style = computed(() => STYLES[this.tone()]);

  constructor() {
    afterNextRender(() => this.cancelButton().nativeElement.focus());
  }

  protected confirm(): void {
    if (!this.disabled()) {
      this.confirmed.emit();
    }
  }
}
