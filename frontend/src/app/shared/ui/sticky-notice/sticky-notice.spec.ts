import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertTone } from '../alert/alert';
import { StickyNotice } from './sticky-notice';

@Component({
  imports: [StickyNotice],
  template: `
    <app-sticky-notice class="mt-6" [tone]="tone()" (dismissed)="dismissals = dismissals + 1">
      Suspendiste La Casona.
    </app-sticky-notice>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<AlertTone>('success');
  dismissals = 0;
}

describe('StickyNotice', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function notice(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('app-sticky-notice') as HTMLElement;
  }

  it('sticks under the header and marks itself for the scroll margin of the page', () => {
    expect(notice().hasAttribute('data-sticky-notice')).toBe(true);
    expect(notice().classList).toContain('sticky');
    expect(notice().classList).toContain('top-20');
    expect(notice().classList).toContain('mt-6');
  });

  it('announces a success as a status and a problem as an alert', async () => {
    expect(notice().querySelector('[role]')?.getAttribute('role')).toBe('status');

    fixture.componentInstance.tone.set('danger');
    await fixture.whenStable();

    expect(notice().querySelector('[role]')?.getAttribute('role')).toBe('alert');
  });

  it('shows the message', () => {
    expect(notice().textContent).toContain('Suspendiste La Casona.');
  });

  it('tells the page when the user closes it', () => {
    notice().querySelector<HTMLButtonElement>('button[aria-label="Cerrar aviso"]')?.click();

    expect(fixture.componentInstance.dismissals).toBe(1);
  });
});
