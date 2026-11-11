import { FormControl, FormGroup } from '@angular/forms';
import { applyFieldErrors } from './field-errors';

describe('applyFieldErrors', () => {
  function form(): FormGroup {
    return new FormGroup({
      email: new FormControl('ana@correo.com'),
      password: new FormControl('secreta123'),
    });
  }

  it('marks each field with the message sent by the server', () => {
    const group = form();

    applyFieldErrors(group, [{ field: 'email', message: 'Ya hay una cuenta con este correo.' }]);

    expect(group.get('email')?.errors).toEqual({ server: 'Ya hay una cuenta con este correo.' });
    expect(group.get('password')?.valid).toBe(true);
  });

  it('ignores fields the form does not have', () => {
    const group = form();

    applyFieldErrors(group, [{ field: 'nickname', message: 'No válido' }]);

    expect(group.valid).toBe(true);
  });

  it('clears the server message once the field changes', () => {
    const group = form();
    applyFieldErrors(group, [{ field: 'email', message: 'Ya hay una cuenta con este correo.' }]);

    group.get('email')?.setValue('otra@correo.com');

    expect(group.get('email')?.valid).toBe(true);
  });
});
