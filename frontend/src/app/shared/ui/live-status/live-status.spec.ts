import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Announcer } from '../live-region/announcer';
import { LiveStatus, LiveStatusState } from './live-status';

@Component({
  imports: [LiveStatus],
  template: `<app-live-status
    [state]="state()"
    [showLive]="showLive()"
    backMessage="De nuevo en vivo. Actualizamos los pedidos."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly state = signal<LiveStatusState>('connecting');
  readonly showLive = signal(true);
}

describe('LiveStatus', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  async function becomes(state: LiveStatusState): Promise<void> {
    fixture.componentInstance.state.set(state);
    await fixture.whenStable();
  }

  function text(): string {
    return (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  it('shows nothing while it connects for the first time', () => {
    expect(text()).toBe('');
    expect(announced()).toEqual([]);
  });

  it('says it is live without announcing it', async () => {
    await becomes('live');

    expect(text()).toBe('En vivo');
    expect(announced()).toEqual([]);
  });

  it('shows nothing while it is live when asked to stay quiet', async () => {
    fixture.componentInstance.showLive.set(false);
    await becomes('live');

    expect(text()).toBe('');
  });

  it('shows and announces that it is reconnecting', async () => {
    await becomes('live');
    await becomes('interrupted');

    expect(text()).toBe('Reconectando…');
    expect(announced()).toEqual(['Se cortó la conexión. Reconectando…']);
  });

  it('announces when it is back after an interruption', async () => {
    await becomes('live');
    await becomes('interrupted');
    await becomes('live');

    expect(text()).toBe('En vivo');
    expect(announced()).toEqual(['De nuevo en vivo. Actualizamos los pedidos.']);
  });
});
