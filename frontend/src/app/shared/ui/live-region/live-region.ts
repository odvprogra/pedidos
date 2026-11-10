import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Announcer } from './announcer';

@Component({
  selector: 'app-live-region',
  templateUrl: './live-region.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveRegion {
  protected readonly announcer = inject(Announcer);
}
