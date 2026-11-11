import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-load-error',
  imports: [Button],
  templateUrl: './load-error.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadError {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly retry = output();

  private readonly retryButton = viewChild.required<ElementRef<HTMLButtonElement>>('retryButton');

  focus(): void {
    this.retryButton().nativeElement.focus();
  }
}
