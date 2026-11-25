import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'success' | 'neutral' | 'danger' | 'warning' | 'info' | 'brand';
export type BadgeSize = 'sm' | 'md';

const TONES: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-line text-ink',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand text-white',
};

const SIZES: Record<BadgeSize, { badge: string; dot: string }> = {
  sm: { badge: 'px-2.5 py-1 text-xs', dot: 'size-1.5' },
  md: { badge: 'px-3 py-1 text-sm', dot: 'size-2' },
};

@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly size = input<BadgeSize>('md');

  protected readonly style = computed(() => `${TONES[this.tone()]} ${SIZES[this.size()].badge}`);
  protected readonly dotSize = computed(() => SIZES[this.size()].dot);
}
