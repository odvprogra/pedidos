import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFound } from './not-found';

@Component({
  imports: [NotFound],
  template: `
    <app-not-found
      heading="No encontramos este pedido"
      message="Puede que el enlace esté incompleto."
    >
      <a href="/pedidos">Ver mis pedidos</a>
    </app-not-found>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly notFound = viewChild.required(NotFound);
}

describe('NotFound', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function view(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('says what is missing as the title of the page', () => {
    const title = view().querySelector('h1');

    expect(title?.textContent?.trim()).toBe('No encontramos este pedido');
    expect(title?.getAttribute('tabindex')).toBe('-1');
  });

  it('explains why and offers the way out', () => {
    expect(view().querySelector('p')?.textContent?.trim()).toBe(
      'Puede que el enlace esté incompleto.',
    );
    expect(view().querySelector('a')?.textContent?.trim()).toBe('Ver mis pedidos');
  });

  it('hides its icon from screen readers', () => {
    expect(view().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes the focus to its title', () => {
    fixture.componentInstance.notFound().focus();

    expect(document.activeElement).toBe(view().querySelector('h1'));
  });
});
