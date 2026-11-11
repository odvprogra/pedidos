import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BackLink } from './back-link';

@Component({
  imports: [BackLink],
  template: `<app-back-link link="..">Restaurantes</app-back-link>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MenuPage {}

@Component({
  imports: [BackLink],
  template: `<app-back-link link="/pedidos">Mis pedidos</app-back-link>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OrderPage {}

describe('BackLink', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'restaurantes/:id', component: MenuPage },
          { path: 'pedidos/:id', component: OrderPage },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  function link(): HTMLAnchorElement {
    return (harness.routeNativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;
  }

  it('says where it goes back to, with an arrow that screen readers skip', async () => {
    await harness.navigateByUrl('/pedidos/12');

    expect(link().textContent?.trim()).toBe('Mis pedidos');
    expect(link().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('goes to an absolute path', async () => {
    await harness.navigateByUrl('/pedidos/12');

    expect(link().getAttribute('href')).toBe('/pedidos');
  });

  it('goes up from the route of the page that shows it', async () => {
    await harness.navigateByUrl('/restaurantes/4');

    expect(link().getAttribute('href')).toBe('/restaurantes');
  });

  it('is a touch target of 44 px', async () => {
    await harness.navigateByUrl('/pedidos/12');

    expect(link().classList).toContain('min-h-11');
  });
});
