import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertTone = 'danger' | 'warning' | 'success';

const STYLES: Record<AlertTone, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
};

const ROLES: Record<AlertTone, 'alert' | 'status'> = {
  danger: 'alert',
  warning: 'alert',
  success: 'status',
};

@Component({
  selector: 'app-alert',
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly tone = input<AlertTone>('danger');

  protected readonly style = computed(() => STYLES[this.tone()]);
  protected readonly role = computed(() => ROLES[this.tone()]);
}
