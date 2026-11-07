import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { RegisterPage } from './register-page';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankPage {}

const LUIS: Account = { id: 3, name: 'Luis Pérez', email: 'luis@correo.com', role: 'OWNER' };
const REGISTER_URL = '/api/v1/auth/register';

describe('RegisterPage', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'registro', component: RegisterPage },
            { path: '**', component: BlankPage },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  async function open(url = '/registro'): Promise<void> {
    harness = await RouterTestingHarness.create(url);
  }

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function field(id: string): HTMLInputElement {
    return page().querySelector(`#${id}`) as HTMLInputElement;
  }

  function messageOf(id: string): string {
    return page().querySelector(`#${id}-message`)?.textContent?.trim() ?? '';
  }

  function roleOption(title: string): HTMLInputElement {
    const labels = Array.from(page().querySelectorAll('label') as NodeListOf<HTMLLabelElement>);
    const label = labels.find((candidate) => candidate.textContent?.includes(title));
    return label?.querySelector('input[type="radio"]') as HTMLInputElement;
  }

  function submitButton(): HTMLButtonElement {
    return page().querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function fill(id: string, value: string): void {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
    field(id).dispatchEvent(new Event('blur'));
  }

  async function submitValidForm(): Promise<void> {
    fill('name', 'Luis Pérez');
    fill('email', 'luis@correo.com');
    fill('password', 'secreta123');
    roleOption('Tengo un restaurante').click();
    submitButton().click();
    await harness.fixture.whenStable();
  }

  function failWith(status: number, code: string, extra: object = {}): void {
    httpTesting
      .expectOne(REGISTER_URL)
      .flush(
        { status, detail: 'Detalle del servidor', code, ...extra },
        { status, statusText: 'Error' },
      );
  }

  it('starts with an empty form that signs up a customer by default', async () => {
    await open();

    expect(field('name').value).toBe('');
    expect(field('email').value).toBe('');
    expect(field('password').value).toBe('');
    expect(roleOption('Quiero pedir comida').checked).toBe(true);
    expect(roleOption('Tengo un restaurante').checked).toBe(false);
    expect(messageOf('password')).toBe('Mínimo 8 caracteres.');
    expect(submitButton().textContent?.trim()).toBe('Crear cuenta');
  });

  it('asks for the missing fields without calling the API', async () => {
    await open();

    submitButton().click();
    await harness.fixture.whenStable();

    httpTesting.expectNone(REGISTER_URL);
    expect(messageOf('name')).toBe('Escribe tu nombre.');
    expect(messageOf('email')).toBe('Escribe tu correo.');
    expect(messageOf('password')).toBe('Crea una contraseña.');
    expect(document.activeElement?.id).toBe('name');
  });

  it.each([
    ['name', '   ', 'Escribe tu nombre.'],
    ['name', 'a'.repeat(101), 'Usa hasta 100 caracteres.'],
    ['email', 'luis@correo', 'Ingresa un correo válido, como ana@correo.com.'],
    ['email', `${'a'.repeat(245)}@correo.com`, 'Usa hasta 254 caracteres.'],
    ['password', 'corta', 'Usa al menos 8 caracteres.'],
    ['password', 'a'.repeat(73), 'Usa hasta 72 caracteres.'],
  ])('rejects %s "%s" when leaving the field', async (id, value, message) => {
    await open();

    fill(id, value);
    await harness.fixture.whenStable();

    expect(messageOf(id)).toBe(message);
    expect(field(id).getAttribute('aria-invalid')).toBe('true');
  });

  it('sends the registration once with the chosen role and shows that it is working', async () => {
    await open();

    await submitValidForm();
    submitButton().click();

    const request = httpTesting.expectOne(REGISTER_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Luis Pérez',
      email: 'luis@correo.com',
      password: 'secreta123',
      role: 'OWNER',
    });
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    expect(submitButton().textContent).toContain('Creando cuenta…');
    request.flush(LUIS, { status: 201, statusText: 'Created' });
  });

  it('starts the session of the new account and goes back to where it was going', async () => {
    await open('/registro?returnUrl=%2Fmi-restaurante');

    await submitValidForm();
    httpTesting.expectOne(REGISTER_URL).flush(LUIS, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(SessionStore).account()).toEqual(LUIS);
    expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
  });

  it.each([
    [409, 'identity.email_taken', 'email', 'Ya hay una cuenta con este correo'],
    [422, 'identity.invalid_email', 'email', 'Ingresa un correo válido'],
    [422, 'identity.password_too_short', 'password', 'Usa al menos 8 caracteres'],
    [422, 'identity.password_too_long', 'password', 'Tu contraseña es demasiado larga'],
  ])('shows a %i %s response under the %s field', async (status, code, id, message) => {
    await open();

    await submitValidForm();
    failWith(status, code);
    await harness.fixture.whenStable();

    expect(messageOf(id)).toContain(message);
    expect(document.activeElement?.id).toBe(id);
    expect(page().querySelector('[role="alert"]')).toBeNull();
    expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    expect(TestBed.inject(SessionStore).account()).toBeNull();
  });

  it('marks the fields rejected by the backend validation', async () => {
    await open();

    await submitValidForm();
    failWith(400, 'validation_failed', {
      errors: [{ field: 'name', message: 'el tamaño debe estar entre 0 y 100' }],
    });
    await harness.fixture.whenStable();

    expect(messageOf('name')).toBe('el tamaño debe estar entre 0 y 100');
    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Revisa los datos marcados',
    );
  });

  it('explains that the server cannot be reached', async () => {
    await open();

    await submitValidForm();
    httpTesting.expectOne(REGISTER_URL).error(new ProgressEvent('error'));
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    expect(submitButton().getAttribute('aria-disabled')).toBe('false');
  });

  it('keeps the return url in the link to log in', async () => {
    await open('/registro?returnUrl=%2Fpedidos');

    const link = page().querySelector('a[href^="/ingresar"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/ingresar?returnUrl=%2Fpedidos');
  });
});
