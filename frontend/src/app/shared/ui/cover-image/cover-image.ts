import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-cover-image',
  imports: [NgOptimizedImage],
  templateUrl: './cover-image.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImage {
  readonly src = input<string | null>(null);

  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
