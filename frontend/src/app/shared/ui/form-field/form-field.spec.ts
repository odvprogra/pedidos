import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextInput } from '../text-input/text-input';
import { FormField } from './form-field';

@Component({
  imports: [FormField, TextInput],
  template: `
    <app-form-field label="Correo" fieldId="email" [error]="error()" [hint]="hint()">
      <input appTextInput id="email" />
    </app-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly error = signal<string | null>(null);
  readonly hint = signal<string | null>('Usa el correo con el que te registraste.');
}

describe('FormField', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function message(): HTMLElement {
    return fixture.nativeElement.querySelector('#email-message');
  }

  it('labels the projected field', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(label.htmlFor).toBe('email');
    expect(label.textContent).toContain('Correo');
  });

  it('links the field to its message', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.id).toBe('email');
    expect(input.getAttribute('aria-describedby')).toBe(message().id);
  });

  it('shows the hint while there is no error', () => {
    expect(message().textContent).toContain('Usa el correo con el que te registraste.');
    expect(message().classList).toContain('text-muted');
  });

  it('replaces the hint with the error', async () => {
    fixture.componentInstance.error.set('Escribe tu correo.');
    await fixture.whenStable();

    expect(message().textContent?.trim()).toBe('Escribe tu correo.');
    expect(message().classList).toContain('text-danger');
  });
});
