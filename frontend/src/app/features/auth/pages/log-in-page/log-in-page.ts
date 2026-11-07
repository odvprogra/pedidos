import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { REGISTER_PATH, safeReturnUrl } from '@core/auth/return-url';
import { SessionStore } from '@core/auth/session-store';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { FormField } from '@shared/ui/form-field/form-field';
import { Spinner } from '@shared/ui/spinner/spinner';
import { TextInput } from '@shared/ui/text-input/text-input';
import { ValidationMessages, validationMessage } from '@shared/utils/validation-message';
import { AuthShell } from '../../components/auth-shell/auth-shell';
import { PasswordField } from '../../components/password-field/password-field';
import { AuthApi } from '../../data-access/auth-api';
import { applyAuthError } from '../../models/auth-error';

type LogInField = 'email' | 'password';

const MESSAGES: Record<LogInField, ValidationMessages> = {
  email: { required: 'Escribe tu correo.' },
  password: { required: 'Escribe tu contraseña.' },
};

@Component({
  selector: 'app-log-in-page',
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
  templateUrl: './log-in-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogInPage {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();
  readonly sessionExpired = input(false, { transform: booleanAttribute });

  protected readonly registerPath = REGISTER_PATH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly alert = signal<string | null>(null);

  protected errorOf(field: LogInField): string | null {
    return validationMessage(this.form.controls[field], MESSAGES[field]);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.alert.set(null);
    this.authApi.logIn(this.form.getRawValue()).subscribe({
      next: (account) => {
        this.session.signIn(account);
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error: unknown) => {
        this.alert.set(applyAuthError(this.form, toProblemDetails(error)));
        this.submitting.set(false);
      },
    });
  }
}
