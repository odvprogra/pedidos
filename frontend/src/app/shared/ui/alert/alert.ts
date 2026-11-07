import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertTone = 'danger' | 'warning';

const STYLES: Record<AlertTone, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
};

@Component({
  selector: 'app-alert',
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly tone = input<AlertTone>('danger');

  protected readonly style = computed(() => STYLES[this.tone()]);
  protected readonly role = computed(() => (this.tone() === 'danger' ? 'alert' : 'status'));
}
