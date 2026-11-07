import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Alert, AlertTone } from './alert';

@Component({
  imports: [Alert],
  template: `<app-alert [tone]="tone()">Tu sesión terminó.</app-alert>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<AlertTone>('danger');
}

describe('Alert', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('interrupts with the message when something failed', () => {
    const alert = fixture.nativeElement.querySelector('[role="alert"]');

    expect(alert.textContent).toContain('Tu sesión terminó.');
    expect(alert.classList).toContain('bg-danger-soft');
  });

  it('announces a warning politely', async () => {
    fixture.componentInstance.tone.set('warning');
    await fixture.whenStable();

    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status.textContent).toContain('Tu sesión terminó.');
    expect(status.classList).toContain('bg-warning-soft');
  });
});
