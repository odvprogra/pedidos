import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountPill } from './count-pill';
import { PageHeader } from './page-header';

@Component({
  imports: [CountPill, PageHeader],
  template: `
    <app-page-header eyebrow="Historial" heading="Mis pedidos" [subtitle]="subtitle()">
      <p appCountPill data-total-orders>12 pedidos</p>
    </app-page-header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly header = viewChild.required(PageHeader);
  readonly subtitle = signal('Sigue cada pedido y retíralo en el local cuando esté listo.');
}

describe('PageHeader', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  function view(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the label, the title of the page and what it is for', () => {
    const texts = Array.from(view().querySelectorAll('header > div > *')).map((node) =>
      node.textContent?.trim(),
    );

    expect(texts).toEqual([
      'Historial',
      'Mis pedidos',
      'Sigue cada pedido y retíralo en el local cuando esté listo.',
    ]);
    expect(view().querySelector('h1')?.textContent?.trim()).toBe('Mis pedidos');
  });

  it('follows a subtitle that changes', async () => {
    fixture.componentInstance.subtitle.set('Registra tu restaurante para empezar.');
    await fixture.whenStable();

    expect(view().querySelector('header p.text-muted')?.textContent?.trim()).toBe(
      'Registra tu restaurante para empezar.',
    );
  });

  it('places what the page adds next to the title', () => {
    const pill = view().querySelector('header > [data-total-orders]');

    expect(pill?.textContent?.trim()).toBe('12 pedidos');
  });

  it('takes the focus to its title without putting it in the tab order', () => {
    fixture.componentInstance.header().focus();

    const title = view().querySelector('h1');
    expect(document.activeElement).toBe(title);
    expect(title?.getAttribute('tabindex')).toBe('-1');
  });
});
