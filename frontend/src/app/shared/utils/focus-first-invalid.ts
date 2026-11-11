import { Injector, afterNextRender } from '@angular/core';

export function focusFirstInvalid(host: HTMLElement, injector: Injector): void {
  afterNextRender(() => host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), {
    injector,
  });
}
