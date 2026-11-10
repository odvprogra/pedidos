import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-link',
  imports: [RouterLink],
  templateUrl: './back-link.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackLink {
  readonly link = input.required<string>();
}
