import { Directive } from '@angular/core';

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class:
      'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70 aria-disabled:cursor-wait aria-disabled:opacity-70',
  },
})
export class Button {}
