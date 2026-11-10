import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@layout/header/header';
import { LiveRegion } from '@shared/ui/live-region/live-region';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, LiveRegion],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
