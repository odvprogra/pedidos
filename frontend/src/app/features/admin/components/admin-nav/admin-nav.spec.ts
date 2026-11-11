import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminNav } from './admin-nav';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Blank {}

describe('AdminNav', () => {
  async function navAt(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin', component: Blank },
          { path: 'admin/restaurantes', component: Blank },
          { path: 'admin/pedidos', component: Blank },
        ]),
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(AdminNav);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function link(nav: HTMLElement, label: string): HTMLAnchorElement {
    const found = Array.from(nav.querySelectorAll('a')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No link says ${label}`);
    }
    return found;
  }

  it('names the sections of the panel and where each one goes', async () => {
    const nav = await navAt('/admin');

    expect(nav.querySelector('nav')?.getAttribute('aria-label')).toBe('Secciones del panel');
    expect(link(nav, 'Cuentas').getAttribute('href')).toBe('/admin');
    expect(link(nav, 'Restaurantes').getAttribute('href')).toBe('/admin/restaurantes');
    expect(link(nav, 'Pedidos').getAttribute('href')).toBe('/admin/pedidos');
  });

  it('marks the accounts as the current section on the panel', async () => {
    const nav = await navAt('/admin');

    expect(link(nav, 'Cuentas').getAttribute('aria-current')).toBe('page');
    expect(link(nav, 'Restaurantes').getAttribute('aria-current')).toBeNull();
    expect(link(nav, 'Pedidos').getAttribute('aria-current')).toBeNull();
  });

  it('marks only the restaurants as current on their section', async () => {
    const nav = await navAt('/admin/restaurantes');

    expect(link(nav, 'Restaurantes').getAttribute('aria-current')).toBe('page');
    expect(link(nav, 'Cuentas').getAttribute('aria-current')).toBeNull();
  });

  it('marks only the orders as current on their section', async () => {
    const nav = await navAt('/admin/pedidos');

    expect(link(nav, 'Pedidos').getAttribute('aria-current')).toBe('page');
    expect(link(nav, 'Cuentas').getAttribute('aria-current')).toBeNull();
    expect(link(nav, 'Restaurantes').getAttribute('aria-current')).toBeNull();
  });
});
