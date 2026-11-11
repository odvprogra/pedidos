import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { Announcer } from './announcer';

@Directive({ selector: '[appAnnounce]' })
export class Announce {
  private readonly announcer = inject(Announcer);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private announcement: number | null = null;

  readonly appAnnounce = input(true, { transform: booleanAttribute });

  constructor() {
    afterNextRender(() => {
      const message = (this.element.nativeElement.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (this.appAnnounce() && message) {
        this.announcement = this.announcer.announce(message);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.announcement !== null) {
        this.announcer.clear(this.announcement);
      }
    });
  }
}
