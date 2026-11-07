import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountAction } from '../../models/account-action';
import { AccountSummary } from '../../models/account-summary';
import { AccountRow } from './account-row';

const ANA: AccountSummary = {
  id: 7,
  name: 'Ana Rojas',
  email: 'ana@correo.com',
  role: 'CUSTOMER',
  suspended: false,
};

@Component({
  imports: [AccountRow],
  template: `
    <app-account-row
      [account]="account()"
      [isSelf]="isSelf()"
      [busy]="busy()"
      [locked]="locked()"
      (confirmed)="confirmed.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly account = signal(ANA);
  readonly isSelf = signal(false);
  readonly busy = signal(false);
  readonly locked = signal(false);
  readonly confirmed: AccountAction[] = [];
}

describe('AccountRow', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function row(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(row().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function ask(): Promise<void> {
    button('Suspender').click();
    await fixture.whenStable();
  }

  it('names the account in the action for screen readers', () => {
    expect(button('Suspender').textContent).toContain('la cuenta de Ana Rojas');
    expect(button('Suspender').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the question below the account and moves the focus to cancel', async () => {
    await ask();

    const question = row().querySelector('[role="group"]') as HTMLElement;
    expect(question.textContent).toContain('¿Suspender la cuenta de Ana Rojas?');
    expect(button('Suspender').getAttribute('aria-expanded')).toBe('true');
    expect(button('Suspender').getAttribute('aria-controls')).toBe(question.id);
    expect(document.activeElement).toBe(button('Cancelar'));
  });

  it('closes the question and gives the focus back to the action', async () => {
    await ask();

    button('Cancelar').click();
    await fixture.whenStable();

    expect(row().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Suspender'));
    expect(host.confirmed).toEqual([]);
  });

  it('closes the question with the escape key', async () => {
    await ask();

    button('Cancelar').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(row().querySelector('[role="group"]')).toBeNull();
  });

  it('closes the question when the action is pressed again', async () => {
    await ask();

    button('Suspender').click();
    await fixture.whenStable();

    expect(row().querySelector('[role="group"]')).toBeNull();
  });

  it('confirms the suspension and keeps the focus on the action', async () => {
    await ask();

    button('Sí, suspender').click();
    await fixture.whenStable();

    expect(host.confirmed).toEqual(['suspend']);
    expect(row().querySelector('[role="group"]')).toBeNull();
    expect(document.activeElement).toBe(button('Suspender'));
  });

  it('confirms the reactivation of a suspended account', async () => {
    host.account.set({ ...ANA, suspended: true });
    await fixture.whenStable();

    button('Reactivar').click();
    await fixture.whenStable();
    expect(row().textContent).toContain('Podrá volver a ingresar');
    button('Sí, reactivar').click();

    expect(host.confirmed).toEqual(['reactivate']);
  });

  it('does not open the question while another action runs', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    await ask();

    expect(button('Suspender').getAttribute('aria-disabled')).toBe('true');
    expect(row().querySelector('[role="group"]')).toBeNull();
  });

  it('does not confirm when another action started after the question opened', async () => {
    await ask();
    host.locked.set(true);
    await fixture.whenStable();

    button('Sí, suspender').click();

    expect(button('Sí, suspender').getAttribute('aria-disabled')).toBe('true');
    expect(host.confirmed).toEqual([]);
  });

  it('shows that it is working on its own action', async () => {
    host.busy.set(true);
    await fixture.whenStable();

    expect(button('Suspendiendo…').getAttribute('aria-disabled')).toBe('true');
  });

  it('protects an admin account and marks the own one', async () => {
    host.account.set({ ...ANA, name: 'Administrador', role: 'ADMIN' });
    host.isSelf.set(true);
    await fixture.whenStable();

    expect(row().querySelector('button')).toBeNull();
    expect(row().textContent).toContain('Protegida');
    expect(row().textContent).toContain('Tú');
  });
});
