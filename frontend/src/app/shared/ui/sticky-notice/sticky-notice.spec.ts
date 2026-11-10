import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertTone } from '../alert/alert';
import { Announcer } from '../live-region/announcer';
import { StickyNotice } from './sticky-notice';

@Component({
  imports: [StickyNotice],
  template: `
    <h1 tabindex="-1">Restaurantes</h1>
    @if (showRefresh()) {
      <button type="button" id="refresh">Actualizar</button>
    }
    <app-sticky-notice class="mt-6" [tone]="tone()" (dismissed)="dismissals = dismissals + 1">
      Suspendiste La Casona.
    </app-sticky-notice>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<AlertTone>('success');
  readonly showRefresh = signal(true);
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

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  it('announces a success in the live region, without a live role of its own', () => {
    expect(notice().querySelector('[role]')).toBeNull();
    expect(announced()).toEqual(['Suspendiste La Casona.']);
  });

  it('interrupts with a problem as an alert, outside the live region', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.tone.set('danger');
    await fixture.whenStable();

    expect(notice().querySelector('[role]')?.getAttribute('role')).toBe('alert');
    expect(announced()).toEqual([]);
  });

  it('takes its announcement back when it leaves the page', () => {
    fixture.destroy();

    expect(announced()).toEqual([]);
  });

  it('shows the message', () => {
    expect(notice().textContent).toContain('Suspendiste La Casona.');
  });

  function closeButton(): HTMLButtonElement {
    return notice().querySelector('button[aria-label="Cerrar aviso"]') as HTMLButtonElement;
  }

  function refreshButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#refresh');
  }

  it('tells the page when the user closes it', () => {
    closeButton().click();

    expect(fixture.componentInstance.dismissals).toBe(1);
  });

  it('returns the focus to where it was before reaching the close button', () => {
    refreshButton().focus();
    closeButton().focus();

    closeButton().click();

    expect(document.activeElement).toBe(refreshButton());
  });

  it('takes the focus to the title when that element is no longer on the page', async () => {
    refreshButton().focus();
    closeButton().focus();
    fixture.componentInstance.showRefresh.set(false);
    await fixture.whenStable();

    closeButton().click();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h1'));
  });

  it('takes the focus to the title when it reached the close button from outside the page', () => {
    closeButton().focus();

    closeButton().click();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h1'));
  });

  it('leaves the focus alone when it was not on the notice', () => {
    refreshButton().focus();

    closeButton().click();

    expect(document.activeElement).toBe(refreshButton());
  });
});
