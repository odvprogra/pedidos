import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { Alert, AlertTone } from '../alert/alert';

@Component({
  selector: 'app-sticky-notice',
  imports: [Alert],
  templateUrl: './sticky-notice.html',
  host: { class: 'sticky top-20 z-5 block', 'data-sticky-notice': '' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyNotice {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private cameFrom: HTMLElement | null = null;

  readonly tone = input.required<AlertTone>();
  readonly dismissed = output();

  protected remember(event: FocusEvent): void {
    this.cameFrom = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
  }

  protected dismiss(): void {
    const focusWasHere = this.host.nativeElement.contains(this.document.activeElement);
    const target = this.cameFrom?.isConnected
      ? this.cameFrom
      : this.document.querySelector<HTMLElement>('h1');
    this.dismissed.emit();
    if (focusWasHere) {
      target?.focus({ preventScroll: true });
    }
  }
}
