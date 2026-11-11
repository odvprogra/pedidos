import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadError } from './load-error';

@Component({
  imports: [LoadError],
  template: `
    <app-load-error [heading]="heading()" [message]="message()" (retry)="retries = retries + 1" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly heading = signal('No pudimos cargar las cuentas');
  readonly message = signal('No hay conexión con el servidor.');
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
    expect(alert().textContent).toContain('No hay conexión con el servidor.');
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

  it('takes the focus to the retry button on request', () => {
    host.loadError().focus();

    expect(document.activeElement).toBe(retryButton());
  });
});
