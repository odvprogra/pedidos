import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export function fieldMessageId(fieldId: string): string {
  return `${fieldId}-message`;
}

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);

  protected readonly messageId = computed(() => fieldMessageId(this.fieldId()));
}
