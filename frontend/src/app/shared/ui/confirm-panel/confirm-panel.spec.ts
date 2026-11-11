import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPanel, ConfirmTone } from './confirm-panel';

@Component({
  imports: [ConfirmPanel],
  template: `
    <app-confirm-panel
      panelId="product-10-confirm"
      question="¿Borrar Silpancho del menú?"
      consequence="Los pedidos anteriores no cambian."
      [confirmLabel]="confirmLabel()"
      [cancelLabel]="cancelLabel()"
      [tone]="tone()"
      [disabled]="disabled()"
      (confirmed)="confirmations = confirmations + 1"
      (cancelled)="cancellations = cancellations + 1"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly confirmLabel = signal<string | null>('Sí, borrar');
  readonly cancelLabel = signal('Cancelar');
  readonly tone = signal<ConfirmTone>('brand');
  readonly disabled = signal(false);
  confirmations = 0;
  cancellations = 0;
}

describe('ConfirmPanel', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function panel(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="group"]');
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(panel().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
  }

  it('asks the question and explains what happens', () => {
    expect(panel().id).toBe('product-10-confirm');
    expect(panel().getAttribute('aria-labelledby')).toBe('product-10-confirm-question');
    expect(panel().textContent).toContain('¿Borrar Silpancho del menú?');
    expect(panel().textContent).toContain('Los pedidos anteriores no cambian.');
    expect(panel().classList).toContain('bg-brand-soft');
  });

  it('takes the focus to cancel as soon as it appears', () => {
    expect(document.activeElement).toBe(button('Cancelar'));
  });

  it('tells when the owner confirms or cancels', () => {
    button('Sí, borrar')?.click();
    button('Cancelar')?.click();

    expect(host.confirmations).toBe(1);
    expect(host.cancellations).toBe(1);
  });

  it('cancels with the escape key', () => {
    button('Sí, borrar')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(host.cancellations).toBe(1);
  });

  it('ignores the confirmation while it is disabled', async () => {
    host.disabled.set(true);
    await fixture.whenStable();

    button('Sí, borrar')?.click();

    expect(button('Sí, borrar')?.getAttribute('aria-disabled')).toBe('true');
    expect(host.confirmations).toBe(0);
  });

  it('only informs when there is nothing to confirm', async () => {
    host.confirmLabel.set(null);
    host.cancelLabel.set('Entendido');
    await fixture.whenStable();

    expect(panel().querySelectorAll('button')).toHaveLength(1);
    expect(button('Entendido')).toBeTruthy();
  });

  it.each([
    ['success', 'bg-success-soft'],
    ['warning', 'bg-warning-soft'],
  ] as const)('uses the colors of the %s tone', async (tone, background) => {
    host.tone.set(tone);
    await fixture.whenStable();

    expect(panel().classList).toContain(background);
  });
});
