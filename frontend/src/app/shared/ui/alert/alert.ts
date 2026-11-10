import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { Announce } from '../live-region/announce';

export type AlertTone = 'danger' | 'warning' | 'success';

const STYLES: Record<AlertTone, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
};

const ROLES: Record<AlertTone, 'alert' | null> = {
  danger: 'alert',
  warning: 'alert',
  success: null,
};

@Component({
  selector: 'app-alert',
  imports: [Announce],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly tone = input<AlertTone>('danger');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissed = output();

  protected readonly style = computed(() => STYLES[this.tone()]);
  protected readonly role = computed(() => ROLES[this.tone()]);
}
