import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Alert, AlertTone } from '../alert/alert';

@Component({
  selector: 'app-sticky-notice',
  imports: [Alert],
  templateUrl: './sticky-notice.html',
  host: { class: 'sticky top-20 z-5 block', 'data-sticky-notice': '' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyNotice {
  readonly tone = input.required<AlertTone>();
  readonly dismissed = output();
}
