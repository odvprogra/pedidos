import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Announcer } from './announcer';
import { LiveRegion } from './live-region';

describe('LiveRegion', () => {
  let fixture: ComponentFixture<LiveRegion>;
  let announcer: Announcer;

  beforeEach(async () => {
    fixture = TestBed.createComponent(LiveRegion);
    announcer = TestBed.inject(Announcer);
    await fixture.whenStable();
  });

  function region(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="status"]');
  }

  it('is a status region that is already there and empty', () => {
    expect(region()).toBeTruthy();
    expect(region().classList).toContain('sr-only');
    expect(region().textContent?.trim()).toBe('');
  });

  it('writes the announcement inside the region', async () => {
    announcer.announce('Cargando tu menú…');
    await fixture.whenStable();

    expect(region().textContent?.trim()).toBe('Cargando tu menú…');
  });

  it('writes a repeated message as a new node, so it is announced again', async () => {
    announcer.announce('Aceptaste el pedido #15.');
    await fixture.whenStable();
    const first = region().querySelector('p');

    announcer.announce('Aceptaste el pedido #15.');
    await fixture.whenStable();

    expect(region().querySelectorAll('p')).toHaveLength(1);
    expect(region().querySelector('p')).not.toBe(first);
  });

  it('empties when the announcement is cleared', async () => {
    const id = announcer.announce('Cargando tu menú…');
    await fixture.whenStable();

    announcer.clear(id);
    await fixture.whenStable();

    expect(region().textContent?.trim()).toBe('');
  });
});
