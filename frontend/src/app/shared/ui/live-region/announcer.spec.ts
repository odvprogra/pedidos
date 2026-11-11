import { TestBed } from '@angular/core/testing';
import { Announcer } from './announcer';

describe('Announcer', () => {
  let announcer: Announcer;

  beforeEach(() => {
    announcer = TestBed.inject(Announcer);
  });

  it('starts with nothing to announce', () => {
    expect(announcer.shown()).toEqual([]);
  });

  it('keeps only the last announcement', () => {
    announcer.announce('Cargando tu menú…');
    announcer.announce('Suspendiste La Casona.');

    expect(announcer.shown().map(({ message }) => message)).toEqual(['Suspendiste La Casona.']);
  });

  it('gives a repeated message a new id, so it is announced again', () => {
    const first = announcer.announce('Aceptaste el pedido #15.');
    const second = announcer.announce('Aceptaste el pedido #15.');

    expect(second).not.toBe(first);
    expect(announcer.shown()).toEqual([{ id: second, message: 'Aceptaste el pedido #15.' }]);
  });

  it('clears an announcement that is still shown', () => {
    const id = announcer.announce('Cargando tu menú…');

    announcer.clear(id);

    expect(announcer.shown()).toEqual([]);
  });

  it('keeps a newer announcement when an older one is cleared', () => {
    const older = announcer.announce('Cargando tu menú…');
    announcer.announce('Borraste Silpancho del menú.');

    announcer.clear(older);

    expect(announcer.shown().map(({ message }) => message)).toEqual([
      'Borraste Silpancho del menú.',
    ]);
  });
});
