import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

@Component({
  imports: [Skeleton],
  template: `<div appSkeleton class="h-4 w-40 rounded"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

describe('Skeleton', () => {
  it('paints a pulsing bar that stays still when the user reduces motion', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const bar = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;

    expect(bar.classList).toContain('animate-pulse');
    expect(bar.classList).toContain('motion-reduce:animate-none');
    expect(bar.classList).toContain('bg-line');
  });

  it('keeps the size and the shape that the page gives it', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const bar = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;

    expect(bar.classList).toContain('h-4');
    expect(bar.classList).toContain('w-40');
    expect(bar.classList).toContain('rounded');
  });
});
