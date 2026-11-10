import { Directive } from '@angular/core';

@Directive({
  selector: 'p[appCountPill]',
  host: {
    class:
      'inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-surface px-4 py-2 text-sm font-bold whitespace-nowrap shadow-sm sm:self-auto',
  },
})
export class CountPill {}
