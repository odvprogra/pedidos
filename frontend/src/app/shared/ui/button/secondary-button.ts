import { Directive, computed, input } from '@angular/core';

export type SecondaryButtonTone = 'neutral' | 'danger' | 'success';

const TONES: Record<SecondaryButtonTone, string> = {
  neutral: 'border-line text-ink hover:bg-canvas focus-visible:outline-ink',
  danger:
    'border-brand/30 text-brand hover:bg-brand-soft hover:text-brand-strong focus-visible:outline-brand aria-expanded:bg-brand-soft aria-expanded:text-brand-strong',
  success:
    'border-success/30 text-success hover:bg-success-soft focus-visible:outline-success aria-expanded:bg-success-soft',
};

@Directive({
  selector: 'button[appSecondaryButton], a[appSecondaryButton]',
  host: {
    class:
      'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-surface px-3.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-60 aria-disabled:hover:bg-surface',
    '[class]': 'toneClasses()',
  },
})
export class SecondaryButton {
  readonly tone = input<SecondaryButtonTone>('neutral');
  readonly working = input(false);

  protected readonly toneClasses = computed(
    () =>
      `${TONES[this.tone()]} ${this.working() ? 'aria-disabled:cursor-wait' : 'aria-disabled:cursor-not-allowed'}`,
  );
}
