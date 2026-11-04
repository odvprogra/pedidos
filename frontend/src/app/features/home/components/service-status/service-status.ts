import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Status, StatusBadge } from '@shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-service-status',
  imports: [StatusBadge],
  templateUrl: './service-status.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStatus {
  readonly name = input.required<string>();
  readonly detail = input.required<string>();
  readonly status = input.required<Status>();
}
