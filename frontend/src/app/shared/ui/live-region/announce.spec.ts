import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Announce } from './announce';
import { Announcer } from './announcer';

@Component({
  imports: [Announce],
  template: `
    @if (loading()) {
      <span class="sr-only" appAnnounce> Cargando tu menú… </span>
    }
    <span [appAnnounce]="false">Suspendiste La Casona.</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly loading = signal(true);
}

describe('Announce', () => {
  let fixture: ComponentFixture<Host>;
  let announcer: Announcer;

  function messages(): string[] {
    return announcer.shown().map(({ message }) => message);
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    announcer = TestBed.inject(Announcer);
    await fixture.whenStable();
  });

  it('announces the text of its element once it is on the page, in a single line', () => {
    expect(messages()).toEqual(['Cargando tu menú…']);
  });

  it('takes its announcement back when its element leaves the page', async () => {
    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();

    expect(messages()).toEqual([]);
  });

  it('keeps a newer announcement when its element leaves the page', async () => {
    announcer.announce('Borraste Silpancho del menú.');

    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();

    expect(messages()).toEqual(['Borraste Silpancho del menú.']);
  });

  it('stays quiet when it is turned off', () => {
    expect(messages()).not.toContain('Suspendiste La Casona.');
  });
});
