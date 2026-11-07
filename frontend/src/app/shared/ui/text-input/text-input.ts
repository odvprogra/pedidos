import { Directive } from '@angular/core';

@Directive({
  selector: 'input[appTextInput]',
  host: {
    class:
      'block w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition outline-none placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-danger aria-invalid:focus:ring-danger/15',
  },
})
export class TextInput {}
