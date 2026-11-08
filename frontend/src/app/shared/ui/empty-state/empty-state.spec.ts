import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state heading="Todavía no hay cuentas" message="Van a aparecer aquí.">
      <svg emptyStateIcon aria-hidden="true" data-icon></svg>
      <button type="button">Crear la primera</button>
    </app-empty-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

describe('EmptyState', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function state(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('titles the empty state and explains what to do', () => {
    expect(state().querySelector('h2')?.textContent).toBe('Todavía no hay cuentas');
    expect(state().querySelector('h2 + p')?.textContent).toBe('Van a aparecer aquí.');
  });

  it('shows the icon inside its circle', () => {
    expect(state().querySelector('span > [data-icon]')).toBeTruthy();
  });

  it('places the action after the message', () => {
    expect(state().querySelector('p + button')?.textContent).toBe('Crear la primera');
  });
});
