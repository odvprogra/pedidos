import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminPanelPage } from './admin-panel-page';

@Component({
  template: '<h1>Cuentas</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AccountsSection {}

@Component({
  template: '<h1>Restaurantes</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RestaurantsSection {}

describe('AdminPanelPage', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            component: AdminPanelPage,
            children: [
              { path: '', component: AccountsSection },
              { path: 'restaurantes', component: RestaurantsSection },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  function panel(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function sectionLink(label: string): HTMLAnchorElement {
    const found = Array.from(
      panel().querySelectorAll<HTMLAnchorElement>('nav[aria-label="Secciones del panel"] a'),
    ).find((candidate) => candidate.textContent?.includes(label));
    if (!found) {
      throw new Error(`No section link says ${label}`);
    }
    return found;
  }

  it('shows the accounts under the sections of the panel', async () => {
    await harness.navigateByUrl('/admin');

    expect(panel().querySelector('h1')?.textContent).toBe('Cuentas');
    expect(sectionLink('Cuentas').getAttribute('aria-current')).toBe('page');
  });

  it('keeps the sections while it shows the restaurants', async () => {
    await harness.navigateByUrl('/admin/restaurantes');

    expect(panel().querySelector('h1')?.textContent).toBe('Restaurantes');
    expect(sectionLink('Restaurantes').getAttribute('aria-current')).toBe('page');
    expect(sectionLink('Cuentas').getAttribute('aria-current')).toBeNull();
  });

  it('keeps the same link in place when the admin switches sections', async () => {
    await harness.navigateByUrl('/admin');
    const restaurants = sectionLink('Restaurantes');

    await harness.navigateByUrl('/admin/restaurantes');

    expect(sectionLink('Restaurantes')).toBe(restaurants);
  });
});
