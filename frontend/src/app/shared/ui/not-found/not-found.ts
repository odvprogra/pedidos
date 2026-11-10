import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');

  readonly heading = input.required<string>();
  readonly message = input.required<string>();

  focus(): void {
    this.title().nativeElement.focus();
  }
}
