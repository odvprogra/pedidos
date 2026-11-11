import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const encoder = new TextEncoder();

export function maxUtf8Bytes(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const bytes = encoder.encode(String(control.value ?? '')).length;
    return bytes > max ? { maxbytes: { max, actual: bytes } } : null;
  };
}
