import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '../button/button';
import { Announce } from '../live-region/announce';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-load-error',
  imports: [Announce, Button, NgTemplateOutlet, Spinner],
  templateUrl: './load-error.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadError {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly retrying = input(false);
  readonly retry = output();

  private readonly retryButton = viewChild.required<ElementRef<HTMLButtonElement>>('retryButton');

  focus(): void {
    this.retryButton().nativeElement.focus();
  }

  protected requestRetry(): void {
    if (!this.retrying()) {
      this.retry.emit();
    }
  }
}
