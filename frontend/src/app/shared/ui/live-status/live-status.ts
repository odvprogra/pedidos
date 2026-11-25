import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Announcer } from '../live-region/announcer';
import { Spinner } from '../spinner/spinner';

export type LiveStatusState = 'connecting' | 'live' | 'interrupted';

@Component({
  selector: 'app-live-status',
  imports: [Spinner],
  templateUrl: './live-status.html',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStatus {
  private readonly announcer = inject(Announcer);
  private previous: LiveStatusState = 'connecting';

  readonly state = input.required<LiveStatusState>();
  readonly showLive = input(false);
  readonly backMessage = input('De nuevo en vivo.');

  constructor() {
    effect(() => {
      const state = this.state();
      if (state === 'interrupted' && this.previous !== 'interrupted') {
        this.announcer.announce('Se cortó la conexión. Reconectando…');
      } else if (state === 'live' && this.previous === 'interrupted') {
        this.announcer.announce(this.backMessage());
      }
      this.previous = state;
    });
  }
}
