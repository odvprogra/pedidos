import { FormGroup } from '@angular/forms';

export interface FieldError {
  field: string;
  message: string;
}

export function applyFieldErrors(form: FormGroup, errors: readonly FieldError[]): void {
  for (const { field, message } of errors) {
    form.get(field)?.setErrors({ server: message });
  }
}
