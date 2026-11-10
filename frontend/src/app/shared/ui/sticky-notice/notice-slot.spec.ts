import { NoticeSlot } from './notice-slot';

describe('NoticeSlot', () => {
  it('starts without a notice', () => {
    expect(new NoticeSlot().shown()).toEqual([]);
  });

  it('shows one notice at a time, the last one', () => {
    const slot = new NoticeSlot();

    slot.show('danger', 'No pudimos suspender la cuenta.');
    slot.show('success', 'Suspendiste la cuenta de Ana Rojas.');

    expect(slot.shown()).toEqual([
      { id: 2, tone: 'success', message: 'Suspendiste la cuenta de Ana Rojas.' },
    ]);
  });

  it('gives a repeated message a new id, so it is announced again', () => {
    const slot = new NoticeSlot();

    slot.show('success', 'Aceptaste el pedido #15.');
    const first = slot.shown()[0];
    slot.show('success', 'Aceptaste el pedido #15.');
    const second = slot.shown()[0];

    expect(second.message).toBe(first.message);
    expect(second.id).not.toBe(first.id);
  });

  it('clears the notice', () => {
    const slot = new NoticeSlot();
    slot.show('warning', 'Este pedido ya cambió.');

    slot.clear();

    expect(slot.shown()).toEqual([]);
  });
});
