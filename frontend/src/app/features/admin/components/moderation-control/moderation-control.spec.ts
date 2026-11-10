import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModerationAction, ModerationCopy } from '../../models/moderation-action';
import { ModerationControl } from './moderation-control';

const SUSPEND: ModerationCopy = {
  label: 'Suspender',
  target: 'La Casona',
  working: 'Suspendiendo…',
  question: '¿Suspender La Casona?',
  consequence: 'Los clientes dejan de verlo.',
  confirm: 'Sí, suspender',
  done: 'Suspendiste La Casona.',
};

const REACTIVATE: ModerationCopy = {
  ...SUSPEND,
  label: 'Reactivar',
  working: 'Reactivando…',
  question: '¿Reactivar La Casona?',
  consequence: 'Los clientes vuelven a verlo.',
  confirm: 'Sí, reactivar',
};

@Component({
  imports: [ModerationControl],
  template: `
    <app-moderation-control
      panelId="restaurant-4-confirm"
      [action]="action()"
      [copy]="copy()"
      [busy]="busy()"
      [locked]="locked()"
      [(confirming)]="confirming"
      (confirmed)="confirmed.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly action = signal<ModerationAction>('suspend');
  readonly copy = signal(SUSPEND);
  readonly busy = signal(false);
  readonly locked = signal(false);
  readonly confirming = signal(false);
  readonly confirmed: ModerationAction[] = [];
}

describe('ModerationControl', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function control(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function question(): HTMLElement | null {
    return control().querySelector('[role="group"]');
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(control().querySelectorAll('button')).find((candidate) =>
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

  function pressEscapeOn(element: HTMLElement): void {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  it('names what it acts on for screen readers', () => {
    expect(button('Suspender').textContent).toContain('La Casona');
    expect(button('Suspender').getAttribute('aria-expanded')).toBe('false');
    expect(button('Suspender').getAttribute('aria-controls')).toBeNull();
  });

  it('opens the question and moves the focus to cancel', async () => {
    await ask();

    expect(question()?.textContent).toContain('¿Suspender La Casona?');
    expect(question()?.id).toBe('restaurant-4-confirm');
    expect(button('Suspender').getAttribute('aria-expanded')).toBe('true');
    expect(button('Suspender').getAttribute('aria-controls')).toBe('restaurant-4-confirm');
    expect(document.activeElement).toBe(button('Cancelar'));
  });

  it('ties the consequence to the question and to its confirmation', async () => {
    await ask();

    const consequence = document.getElementById(
      question()?.getAttribute('aria-describedby') ?? '',
    ) as HTMLElement;
    expect(consequence.textContent).toContain('Los clientes dejan de verlo.');
    expect(button('Sí, suspender').getAttribute('aria-describedby')).toBe(consequence.id);
  });

  it('closes the question and gives the focus back to the action', async () => {
    await ask();

    button('Cancelar').click();
    await fixture.whenStable();

    expect(question()).toBeNull();
    expect(document.activeElement).toBe(button('Suspender'));
    expect(host.confirmed).toEqual([]);
  });

  it.each(['Cancelar', 'Sí, suspender', 'Suspender'])(
    'closes the question with the escape key from %s',
    async (label) => {
      await ask();

      pressEscapeOn(button(label));
      await fixture.whenStable();

      expect(question()).toBeNull();
      expect(document.activeElement).toBe(button('Suspender'));
    },
  );

  it('ignores the escape key while the question is closed', async () => {
    pressEscapeOn(button('Suspender'));
    await fixture.whenStable();

    expect(question()).toBeNull();
    expect(host.confirmed).toEqual([]);
  });

  it('closes the question when the action is pressed again', async () => {
    await ask();

    button('Suspender').click();
    await fixture.whenStable();

    expect(question()).toBeNull();
  });

  it('confirms the action and keeps the focus on it', async () => {
    await ask();

    button('Sí, suspender').click();
    await fixture.whenStable();

    expect(host.confirmed).toEqual(['suspend']);
    expect(question()).toBeNull();
    expect(document.activeElement).toBe(button('Suspender'));
  });

  it.each([
    ['suspend', SUSPEND, 'border-brand/30', 'bg-brand-soft'],
    ['reactivate', REACTIVATE, 'border-success/30', 'bg-success-soft'],
  ] as const)('gives %s its own tone', async (action, copy, buttonTone, panelTone) => {
    host.action.set(action);
    host.copy.set(copy);
    await fixture.whenStable();

    button(copy.label).click();
    await fixture.whenStable();

    expect(button(copy.label).className).toContain(buttonTone);
    expect(question()?.className).toContain(panelTone);
    button(copy.confirm).click();
    expect(host.confirmed).toEqual([action]);
  });

  it('does not open the question while another action runs', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    await ask();

    expect(button('Suspender').getAttribute('aria-disabled')).toBe('true');
    expect(question()).toBeNull();
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

  it('tells the page whether its question is open', async () => {
    await ask();

    expect(host.confirming()).toBe(true);

    button('Cancelar').click();
    await fixture.whenStable();

    expect(host.confirming()).toBe(false);
  });

  it('closes its question when the page opens another one', async () => {
    await ask();

    host.confirming.set(false);
    await fixture.whenStable();

    expect(question()).toBeNull();
    expect(button('Suspender').getAttribute('aria-expanded')).toBe('false');
  });
});
