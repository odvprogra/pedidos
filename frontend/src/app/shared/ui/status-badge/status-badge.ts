import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type Status = 'ok' | 'error' | 'pending';

const LABELS: Record<Status, string> = {
  ok: 'Activo',
  error: 'Sin conexión',
  pending: 'Verificando',
};

const STYLES: Record<Status, string> = {
  ok: 'bg-success-soft text-success',
  error: 'bg-danger-soft text-danger',
  pending: 'bg-line text-muted',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<Status>();

  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly style = computed(() => STYLES[this.status()]);
}
