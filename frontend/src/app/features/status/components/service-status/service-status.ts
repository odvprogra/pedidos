import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge } from '@shared/ui/badge/badge';
import {
  SERVICE_STATE_LABELS,
  SERVICE_STATE_TONES,
  ServiceState,
} from '../../models/service-state';

@Component({
  selector: 'app-service-status',
  imports: [Badge],
  templateUrl: './service-status.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStatus {
  readonly name = input.required<string>();
  readonly detail = input.required<string>();
  readonly status = input.required<ServiceState>();

  protected readonly label = computed(() => SERVICE_STATE_LABELS[this.status()]);
  protected readonly tone = computed(() => SERVICE_STATE_TONES[this.status()]);
}
