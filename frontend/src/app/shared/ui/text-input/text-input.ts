import { Directive, computed, input } from '@angular/core';
import { fieldMessageId } from '../form-field/form-field';

@Directive({
  selector: 'input[appTextInput]',
  host: {
    class:
      'block w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition outline-hidden placeholder:text-muted focus:border-brand focus:outline-2 focus:outline-offset-2 focus:outline-brand focus:outline-solid aria-invalid:border-danger aria-invalid:focus:outline-danger',
    '[id]': 'id()',
    '[attr.aria-describedby]': 'messageId()',
  },
})
export class TextInput {
  readonly id = input.required<string>();

  protected readonly messageId = computed(() => fieldMessageId(this.id()));
}
