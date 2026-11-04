import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  VERSION,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Status } from '@shared/ui/status-badge/status-badge';
import { ServiceStatus } from '../../components/service-status/service-status';
import { HealthApi } from '../../data-access/health-api';
import { HealthStatus } from '../../models/health-status';

@Component({
  selector: 'app-home-page',
  imports: [ServiceStatus],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly healthApi = inject(HealthApi);

  protected readonly angularVersion = VERSION.full;
  protected readonly health = signal<HealthStatus | null>(null);
  protected readonly loading = signal(true);

  protected readonly backendStatus = computed<Status>(() => {
    if (this.loading()) {
      return 'pending';
    }
    return this.health() ? 'ok' : 'error';
  });

  protected readonly databaseStatus = computed<Status>(() => {
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
