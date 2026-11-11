import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Badge, BadgeSize, BadgeTone } from './badge';

@Component({
  imports: [Badge],
  template: `<app-badge [tone]="tone()" [size]="size()">Abierto</app-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly tone = signal<BadgeTone>('neutral');
  readonly size = signal<BadgeSize>('md');
}

describe('Badge', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function pill(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('app-badge > span') as HTMLElement;
  }

  async function show(tone: BadgeTone, size: BadgeSize = 'md'): Promise<void> {
    fixture.componentInstance.tone.set(tone);
    fixture.componentInstance.size.set(size);
    await fixture.whenStable();
  }

  it('shows its label next to a dot that screen readers skip', () => {
    expect(pill().textContent?.trim()).toBe('Abierto');
    expect(pill().querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it.each([
    ['success', 'bg-success-soft', 'text-success'],
    ['neutral', 'bg-line', 'text-ink'],
    ['danger', 'bg-danger-soft', 'text-danger'],
    ['warning', 'bg-warning-soft', 'text-warning'],
    ['info', 'bg-info-soft', 'text-info'],
  ] as const)('paints the %s tone with its tokens', async (tone, background, text) => {
    await show(tone);

    expect(pill().classList).toContain(background);
    expect(pill().classList).toContain(text);
  });

  it('keeps its shape when the tone changes', async () => {
    await show('success');

    expect(pill().classList).toContain('rounded-full');
    expect(pill().classList).toContain('font-bold');
  });

  it.each([
    ['sm', 'text-xs'],
    ['md', 'text-sm'],
  ] as const)('uses the %s size', async (size, text) => {
    await show('neutral', size);

    expect(pill().classList).toContain(text);
  });
});
