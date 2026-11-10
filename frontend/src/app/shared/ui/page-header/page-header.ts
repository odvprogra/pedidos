import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');

  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  readonly subtitle = input.required<string>();

  focus(): void {
    this.title().nativeElement.focus();
  }
}
