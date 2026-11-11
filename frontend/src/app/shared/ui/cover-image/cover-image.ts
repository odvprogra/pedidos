import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-cover-image',
  imports: [NgOptimizedImage],
  template: `
    @if (src(); as source) {
      @if (!failed()) {
        <img
          class="bg-surface object-cover"
          alt=""
          fill
          [ngSrc]="source"
          (error)="failed.set(true)"
        />
      }
    }
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImage {
  readonly src = input<string | null>(null);

  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
