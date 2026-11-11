import { AbstractControl } from '@angular/forms';

export type ValidationMessages = Record<string, string>;

export function validationMessage(
  control: AbstractControl,
  messages: ValidationMessages,
): string | null {
  const errors = control.errors;
  if (!control.touched || !errors) {
    return null;
  }
  const server: unknown = errors['server'];
  if (typeof server === 'string') {
    return server;
  }
  const failed = Object.keys(messages).find((name) => name in errors);
  return failed ? messages[failed] : null;
}
