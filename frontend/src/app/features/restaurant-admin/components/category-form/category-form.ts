import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldViolation } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { FormField } from '@shared/ui/form-field/form-field';
import { Spinner } from '@shared/ui/spinner/spinner';
import { TextInput } from '@shared/ui/text-input/text-input';
import { applyFieldErrors } from '@shared/utils/field-errors';
import { focusFirstInvalid } from '@shared/utils/focus-first-invalid';
import { validationMessage } from '@shared/utils/validation-message';

const NAME_MESSAGES = {
  required: 'Escribe el nombre de la categoría.',
  pattern: 'Escribe el nombre de la categoría.',
  maxlength: 'Usa hasta 60 caracteres.',
};

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, Alert, Button, FormField, SecondaryButton, Spinner, TextInput],
  templateUrl: './category-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly heading = input.required<string>();
  readonly initialName = input('');
  readonly submitLabel = input.required<string>();
  readonly saving = input(false);
  readonly errors = input<readonly FieldViolation[]>([]);
  readonly alert = input<string | null>(null);
  readonly save = output<string>();
  readonly cancelled = output();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
  });

  constructor() {
    effect(() => {
      const errors = this.errors();
      if (errors.length > 0) {
        applyFieldErrors(this.form, errors);
        focusFirstInvalid(this.host.nativeElement, this.injector);
      }
    });
    afterNextRender(() => this.host.nativeElement.querySelector('input')?.focus());
  }

  ngOnInit(): void {
    this.form.setValue({ name: this.initialName() });
  }

  protected nameError(): string | null {
    return validationMessage(this.form.controls.name, NAME_MESSAGES);
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }
    this.save.emit(this.form.getRawValue().name.trim());
  }
}
