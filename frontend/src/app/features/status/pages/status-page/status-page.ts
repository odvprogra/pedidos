import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  VERSION,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Button } from '@shared/ui/button/button';
import { ServiceStatus } from '../../components/service-status/service-status';
import { HealthApi } from '../../data-access/health-api';
import { HealthStatus } from '../../models/health-status';
import { ServiceState } from '../../models/service-state';

@Component({
  selector: 'app-status-page',
  imports: [Button, ServiceStatus],
  templateUrl: './status-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage implements OnInit {
  private readonly healthApi = inject(HealthApi);

  protected readonly angularVersion = VERSION.full;
  protected readonly health = signal<HealthStatus | null>(null);
  protected readonly loading = signal(true);

  protected readonly backendStatus = computed<ServiceState>(() => {
    if (this.loading()) {
      return 'pending';
    }
    return this.health() ? 'ok' : 'error';
  });

  protected readonly databaseStatus = computed<ServiceState>(() => {
    if (this.loading()) {
      return 'pending';
    }
    return this.health()?.databaseConnected ? 'ok' : 'error';
  });

  protected readonly backendDetail = computed(() => {
    const health = this.health();
    return health
      ? `Spring Boot ${health.springBootVersion} · Java ${health.javaVersion}`
      : 'Spring Boot';
  });

  protected readonly databaseDetail = computed(() => {
    const version = this.health()?.databaseVersion;
    return version ? `PostgreSQL ${version}` : 'PostgreSQL';
  });

  ngOnInit(): void {
    this.check();
  }

  protected check(): void {
    this.loading.set(true);
    this.healthApi.check().subscribe({
      next: (health) => {
        this.health.set(health);
        this.loading.set(false);
      },
      error: () => {
        this.health.set(null);
        this.loading.set(false);
      },
    });
  }
}
