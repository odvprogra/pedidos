import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadError } from './load-error';

@Component({
  imports: [LoadError],
  template: `
    <app-load-error
      [heading]="heading()"
      [message]="message()"
      [retrying]="retrying()"
      (retry)="retries = retries + 1"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly heading = signal('No pudimos cargar las cuentas');
  readonly message = signal('No hay conexión. Revisa tu internet e intenta de nuevo.');
  readonly retrying = signal(false);
  readonly loadError = viewChild.required(LoadError);
  retries = 0;
}

describe('LoadError', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function alert(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  function retryButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  it('announces what failed and why', () => {
    expect(alert().querySelector('h2')?.textContent).toContain('No pudimos cargar las cuentas');
    expect(alert().textContent).toContain('No hay conexión. Revisa tu internet');
  });

  it('shows the latest reason it receives', async () => {
    host.message.set('Detalle del servidor');
    await fixture.whenStable();

    expect(alert().textContent).toContain('Detalle del servidor');
    expect(alert().textContent).not.toContain('No hay conexión');
  });

  it('asks to load again when the button is pressed', () => {
    expect(retryButton().textContent).toContain('Reintentar');

    retryButton().click();

    expect(host.retries).toBe(1);
  });

  it('keeps the reason in view and says that it is retrying', async () => {
    host.retrying.set(true);
    await fixture.whenStable();

    const reason = fixture.nativeElement.querySelector('[data-reason]') as HTMLElement;
    expect(reason.textContent).toContain('No pudimos cargar las cuentas');
    expect(reason.textContent).toContain('No hay conexión.');
    expect(retryButton().textContent).toContain('Reintentando…');
    expect(retryButton().querySelector('app-spinner')).toBeTruthy();
    expect(retryButton().getAttribute('aria-disabled')).toBe('true');
  });

  it('ignores the button while it retries', async () => {
    host.retrying.set(true);
    await fixture.whenStable();

    retryButton().click();

    expect(host.retries).toBe(0);
  });

  it('keeps the focus on the button while it retries', async () => {
    retryButton().focus();

    host.retrying.set(true);
    await fixture.whenStable();

    expect(document.activeElement).toBe(retryButton());
  });

  it('announces the reason again when the retry fails', async () => {
    const before = alert();
    host.retrying.set(true);
    await fixture.whenStable();
    expect(alert()).toBeNull();

    host.retrying.set(false);
    await fixture.whenStable();

    expect(alert()).not.toBe(before);
    expect(alert().textContent).toContain('No pudimos cargar las cuentas');
    expect(retryButton().textContent).toContain('Reintentar');
    expect(retryButton().getAttribute('aria-disabled')).toBe('false');
  });

  it('takes the focus to the retry button on request', () => {
    host.loadError().focus();

    expect(document.activeElement).toBe(retryButton());
  });
});
