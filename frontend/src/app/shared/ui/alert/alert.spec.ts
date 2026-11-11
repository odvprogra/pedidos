import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Announcer } from '../live-region/announcer';
import { Alert, AlertTone } from './alert';

@Component({
  imports: [Alert],
  template: `
    <app-alert
      [tone]="tone()"
      [dismissible]="dismissible()"
      (dismissed)="dismissals = dismissals + 1"
    >
      {{ message() }}
    </app-alert>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<AlertTone>('danger');
  readonly message = signal('Tu sesión terminó.');
  readonly dismissible = signal(false);
  dismissals = 0;
}

describe('Alert', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function alert(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  function closeButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button[aria-label="Cerrar aviso"]');
  }

  it('announces that something failed', () => {
    expect(alert().textContent).toContain('Tu sesión terminó.');
    expect(alert().classList).toContain('bg-danger-soft');
  });

  it('announces a warning with its own colors', async () => {
    host.tone.set('warning');
    await fixture.whenStable();

    expect(alert().textContent).toContain('Tu sesión terminó.');
    expect(alert().classList).toContain('bg-warning-soft');
  });

  it('shows a success without interrupting and leaves its announcement to the live region', async () => {
    host.tone.set('success');
    host.message.set('Suspendiste la cuenta de Ana Rojas.');
    await fixture.whenStable();

    const box = fixture.nativeElement.querySelector('.bg-success-soft') as HTMLElement;
    expect(alert()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role]')).toBeNull();
    expect(box.textContent).toContain('Suspendiste la cuenta de Ana Rojas.');
  });

  it('announces a success in the live region and a problem only as an alert', async () => {
    expect(TestBed.inject(Announcer).shown()).toEqual([]);

    fixture.destroy();
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.tone.set('success');
    fixture.componentInstance.message.set('Suspendiste la cuenta de Ana Rojas.');
    await fixture.whenStable();

    expect(
      TestBed.inject(Announcer)
        .shown()
        .map(({ message }) => message),
    ).toEqual(['Suspendiste la cuenta de Ana Rojas.']);
  });

  it('has no close button unless it can be dismissed', () => {
    expect(closeButton()).toBeNull();
  });

  it('tells when the close button is pressed', async () => {
    host.dismissible.set(true);
    await fixture.whenStable();

    closeButton()?.click();

    expect(host.dismissals).toBe(1);
  });
});
