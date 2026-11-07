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

  function alert(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  it('announces that something failed', () => {
    expect(alert().textContent).toContain('Tu sesión terminó.');
    expect(alert().classList).toContain('bg-danger-soft');
  });

  it('announces a warning with its own colors', async () => {
    fixture.componentInstance.tone.set('warning');
    await fixture.whenStable();

    expect(alert().textContent).toContain('Tu sesión terminó.');
    expect(alert().classList).toContain('bg-warning-soft');
  });

  it('reports a success politely instead of interrupting', async () => {
    fixture.componentInstance.tone.set('success');
    await fixture.whenStable();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(alert()).toBeNull();
    expect(status.textContent).toContain('Tu sesión terminó.');
    expect(status.classList).toContain('bg-success-soft');
  });
});
