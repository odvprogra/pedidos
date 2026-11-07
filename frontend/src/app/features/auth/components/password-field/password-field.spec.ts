import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { PasswordField } from './password-field';

describe('PasswordField', () => {
  let fixture: ComponentFixture<PasswordField>;
  let control: FormControl<string>;

  beforeEach(async () => {
    control = new FormControl('', { nonNullable: true });
    fixture = TestBed.createComponent(PasswordField);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('fieldId', 'password');
    fixture.componentRef.setInput('autocomplete', 'current-password');
    await fixture.whenStable();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  function toggle(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  it('hides what the person types', () => {
    expect(input().type).toBe('password');
    expect(toggle().getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('shows and hides the password with the toggle button', async () => {
    toggle().click();
    await fixture.whenStable();

    expect(input().type).toBe('text');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');

    toggle().click();
    await fixture.whenStable();

    expect(input().type).toBe('password');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('links the field to the message below it', () => {
    expect(input().id).toBe('password');
    expect(input().getAttribute('aria-describedby')).toBe('password-message');
  });

  it('writes what the person types into the form control', () => {
    input().value = 'secreta123';
    input().dispatchEvent(new Event('input'));

    expect(control.value).toBe('secreta123');
  });
});
