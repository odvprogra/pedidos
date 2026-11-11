import { FormControl, Validators } from '@angular/forms';
import { validationMessage } from './validation-message';

const MESSAGES = {
  required: 'Escribe tu nombre.',
  maxlength: 'Usa hasta 5 caracteres.',
};

function touched(value: string): FormControl<string> {
  const control = new FormControl(value, {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(5)],
  });
  control.markAsTouched();
  return control;
}

describe('validationMessage', () => {
  it('stays silent until the field is touched', () => {
    const control = new FormControl('', { nonNullable: true, validators: Validators.required });

    expect(validationMessage(control, MESSAGES)).toBeNull();
  });

  it('stays silent when the field is valid', () => {
    expect(validationMessage(touched('Ana'), MESSAGES)).toBeNull();
  });

  it('returns the message of the failed rule', () => {
    expect(validationMessage(touched('Ana María'), MESSAGES)).toBe('Usa hasta 5 caracteres.');
  });

  it('prefers the message sent by the server', () => {
    const control = touched('Ana');

    control.setErrors({ server: 'Ya existe una cuenta con este correo.' });

    expect(validationMessage(control, MESSAGES)).toBe('Ya existe una cuenta con este correo.');
  });

  it('returns nothing for a rule without a message', () => {
    const control = touched('Ana');

    control.setErrors({ pattern: true });

    expect(validationMessage(control, MESSAGES)).toBeNull();
  });
});
