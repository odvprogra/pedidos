import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecondaryButton, SecondaryButtonSize, SecondaryButtonTone } from './secondary-button';

@Component({
  imports: [SecondaryButton],
  template: `
    <button
      appSecondaryButton
      type="button"
      class="w-full"
      [tone]="tone()"
      [size]="size()"
      [working]="working()"
    >
      Cancelar
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<SecondaryButtonTone>('neutral');
  readonly size = signal<SecondaryButtonSize>('md');
  readonly working = signal(false);
}

describe('SecondaryButton', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function button(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
  }

  it('is a 44 px neutral button by default and keeps the classes of the page', () => {
    expect(button().classList).toContain('min-h-11');
    expect(button().classList).not.toContain('min-h-12');
    expect(button().classList).toContain('border-line');
    expect(button().classList).toContain('w-full');
  });

  it('grows to the height of the main button when it is large', async () => {
    fixture.componentInstance.size.set('lg');
    await fixture.whenStable();

    expect(button().classList).toContain('min-h-12');
    expect(button().classList).not.toContain('min-h-11');
    expect(button().classList).toContain('w-full');
  });

  it.each([
    ['danger', 'text-brand'],
    ['success', 'text-success'],
  ] as const)('paints the %s tone with its tokens', async (tone, text) => {
    fixture.componentInstance.tone.set(tone);
    await fixture.whenStable();

    expect(button().classList).toContain(text);
    expect(button().classList).not.toContain('border-line');
  });

  it('shows a waiting cursor only while it works', async () => {
    expect(button().classList).toContain('aria-disabled:cursor-not-allowed');

    fixture.componentInstance.working.set(true);
    await fixture.whenStable();

    expect(button().classList).toContain('aria-disabled:cursor-wait');
    expect(button().classList).not.toContain('aria-disabled:cursor-not-allowed');
  });
});
