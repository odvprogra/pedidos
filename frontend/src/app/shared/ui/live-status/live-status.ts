import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Announcer } from '../live-region/announcer';
import { Spinner } from '../spinner/spinner';

export type LiveStatusState = 'connecting' | 'live' | 'interrupted';

@Component({
  selector: 'app-live-status',
  imports: [Spinner],
  templateUrl: './live-status.html',
  host: { class: 'inline-flex empty:hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStatus {
  private readonly announcer = inject(Announcer);
  private previous: LiveStatusState = 'connecting';
  private readonly wasLive = signal(false);

  readonly state = input.required<LiveStatusState>();
  readonly showLive = input(false);
  readonly backMessage = input('De nuevo en vivo.');

  protected readonly looksLive = computed(
    () => this.state() === 'live' || (this.state() === 'connecting' && this.wasLive()),
  );

  constructor() {
    effect(() => {
      const state = this.state();
      if (state === 'interrupted' && this.previous !== 'interrupted') {
        this.announcer.announce('Se cortó la conexión. Reconectando…');
      } else if (state === 'live' && this.previous === 'interrupted') {
        this.announcer.announce(this.backMessage());
      }
      if (state === 'live') {
        this.wasLive.set(true);
      }
      this.previous = state;
    });
  }
}
