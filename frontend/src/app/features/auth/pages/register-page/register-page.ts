import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LOG_IN_PATH } from '@core/auth/auth-paths';
import { safeReturnUrl } from '@core/auth/return-url';
import { SessionStore } from '@core/auth/session-store';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { FormField } from '@shared/ui/form-field/form-field';
import { Spinner } from '@shared/ui/spinner/spinner';
import { TextInput } from '@shared/ui/text-input/text-input';
import { applyFieldErrors } from '@shared/utils/field-errors';
import { ValidationMessages, validationMessage } from '@shared/utils/validation-message';
import { AuthShell } from '../../components/auth-shell/auth-shell';
import { PasswordField } from '../../components/password-field/password-field';
import { AuthApi } from '../../data-access/auth-api';
import { describeAuthError } from '../../models/auth-error';
import { RegistrableRole } from '../../models/credentials';

type RegisterField = 'name' | 'email' | 'password';

interface RoleOption {
  value: RegistrableRole;
  title: string;
  description: string;
}

const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MESSAGES: Record<RegisterField, ValidationMessages> = {
  name: {
    required: 'Escribe tu nombre.',
    pattern: 'Escribe tu nombre.',
    maxlength: 'Usa hasta 100 caracteres.',
  },
  email: {
    required: 'Escribe tu correo.',
    pattern: 'Ingresa un correo válido, como ana@correo.com.',
    maxlength: 'Usa hasta 254 caracteres.',
  },
  password: {
    required: 'Crea una contraseña.',
    minlength: 'Usa al menos 8 caracteres.',
    maxlength: 'Usa hasta 72 caracteres.',
  },
};

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AuthShell,
    FormField,
    PasswordField,
    Spinner,
    TextInput,
  ],
  templateUrl: './register-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly returnUrl = input<string>();

  protected readonly logInPath = LOG_IN_PATH;
  protected readonly roleOptions: RoleOption[] = [
    {
      value: 'CUSTOMER',
      title: 'Quiero pedir comida',
      description: 'Explora menús y pide en tus locales favoritos.',
    },
    {
      value: 'OWNER',
      title: 'Tengo un restaurante',
      description: 'Publica tu menú y recibe pedidos.',
    },
  ];
  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_FORMAT), Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: this.formBuilder.control<RegistrableRole>('CUSTOMER', Validators.required),
  });
  protected readonly submitting = signal(false);
  protected readonly alert = signal<string | null>(null);

  protected errorOf(field: RegisterField): string | null {
    return validationMessage(this.form.controls[field], MESSAGES[field]);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.alert.set(null);
    this.authApi.register(this.form.getRawValue()).subscribe({
      next: (account) => {
        this.session.signIn(account);
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error: unknown) => {
        const { fieldErrors, alert } = describeAuthError(toProblemDetails(error));
        applyFieldErrors(this.form, fieldErrors);
        this.alert.set(alert);
        this.submitting.set(false);
      },
    });
  }
}
