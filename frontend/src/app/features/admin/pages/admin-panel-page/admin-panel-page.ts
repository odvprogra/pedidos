import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminNav } from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-panel-page',
  imports: [AdminNav, RouterOutlet],
  templateUrl: './admin-panel-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelPage {}
