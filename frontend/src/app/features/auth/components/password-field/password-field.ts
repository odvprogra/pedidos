import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextInput } from '@shared/ui/text-input/text-input';

@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule, TextInput],
  templateUrl: './password-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordField {
  readonly control = input.required<FormControl<string>>();
  readonly fieldId = input.required<string>();
  readonly autocomplete = input.required<'current-password' | 'new-password'>();
  readonly invalid = input(false);

  protected readonly visible = signal(false);

  protected toggle(): void {
    this.visible.update((visible) => !visible);
  }
}
