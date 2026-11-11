import { Directive } from '@angular/core';

@Directive({
  selector: 'div[appSkeleton]',
  host: { class: 'animate-pulse bg-line motion-reduce:animate-none' },
})
export class Skeleton {}
