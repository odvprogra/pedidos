import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthStatus } from '../../models/health-status';
import { StatusPage } from './status-page';

const HEALTHY: HealthStatus = {
  status: 'UP',
  javaVersion: '21.0.8',
  springBootVersion: '4.1.1',
  databaseConnected: true,
  databaseVersion: '17.6',
};

describe('StatusPage', () => {
  let fixture: ComponentFixture<StatusPage>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StatusPage);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  function statuses(): string[] {
    const badges = fixture.nativeElement.querySelectorAll('[data-status]');
    return Array.from(badges, (badge: Element) => badge.getAttribute('data-status') ?? '');
  }

  it('shows every service as active when the health check succeeds', async () => {
    httpTesting.expectOne('/api/health').flush(HEALTHY);
    await fixture.whenStable();

    expect(statuses()).toEqual(['ok', 'ok', 'ok']);
    expect(fixture.nativeElement.textContent).toContain('Spring Boot 4.1.1');
    expect(fixture.nativeElement.textContent).toContain('PostgreSQL 17.6');
  });

  it('marks backend and database as unreachable when the request fails', async () => {
    httpTesting.expectOne('/api/health').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(statuses()).toEqual(['ok', 'error', 'error']);
  });

  it('marks only the database as unreachable when the backend cannot reach it', async () => {
    httpTesting
      .expectOne('/api/health')
      .flush({ ...HEALTHY, databaseConnected: false, databaseVersion: null });
    await fixture.whenStable();

    expect(statuses()).toEqual(['ok', 'ok', 'error']);
  });
});
