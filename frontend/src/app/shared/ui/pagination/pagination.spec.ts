import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: `
    <app-pagination
      [page]="page()"
      [totalPages]="totalPages()"
      [disabled]="disabled()"
      (pageChange)="requested.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly page = signal(1);
  readonly totalPages = signal(3);
  readonly disabled = signal(false);
  readonly requested: number[] = [];
}

describe('Pagination', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function button(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );
    const found = buttons.find((candidate) => candidate.textContent?.includes(label));
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function show(page: number, totalPages: number): Promise<void> {
    host.page.set(page);
    host.totalPages.set(totalPages);
    await fixture.whenStable();
  }

  it('shows the current page counting from one', () => {
    expect(fixture.nativeElement.textContent.replace(/\s+/g, ' ')).toContain('Página 2 de 3');
  });

  it('asks for the previous and the next page', () => {
    button('Anterior').click();
    button('Siguiente').click();

    expect(host.requested).toEqual([0, 2]);
  });

  it('does not go back from the first page', async () => {
    await show(0, 3);

    button('Anterior').click();

    expect(button('Anterior').getAttribute('aria-disabled')).toBe('true');
    expect(button('Siguiente').getAttribute('aria-disabled')).toBe('false');
    expect(host.requested).toEqual([]);
  });

  it('does not go forward from the last page', async () => {
    await show(2, 3);

    button('Siguiente').click();

    expect(button('Siguiente').getAttribute('aria-disabled')).toBe('true');
    expect(button('Anterior').getAttribute('aria-disabled')).toBe('false');
    expect(host.requested).toEqual([]);
  });

  it('ignores both buttons while it is disabled', async () => {
    host.disabled.set(true);
    await fixture.whenStable();

    button('Anterior').click();
    button('Siguiente').click();

    expect(button('Anterior').getAttribute('aria-disabled')).toBe('true');
    expect(button('Siguiente').getAttribute('aria-disabled')).toBe('true');
    expect(host.requested).toEqual([]);
  });
});
