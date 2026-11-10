import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountPill } from './count-pill';

@Component({
  imports: [CountPill],
  template: `<p appCountPill data-total>13 restaurantes</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

describe('CountPill', () => {
  async function pill(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('[data-total]') as HTMLElement;
  }

  it('shows the count that the page gives it', async () => {
    expect((await pill()).textContent?.trim()).toBe('13 restaurantes');
  });

  it('keeps the count on one line next to a long subtitle', async () => {
    const classes = (await pill()).classList;

    expect(classes).toContain('shrink-0');
    expect(classes).toContain('whitespace-nowrap');
  });

  it('sits at the start of the header on the phone and at the end from sm up', async () => {
    const classes = (await pill()).classList;

    expect(classes).toContain('self-start');
    expect(classes).toContain('sm:self-auto');
  });
});
