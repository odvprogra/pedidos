import { ConfirmationSlot } from './confirmation-slot';

describe('ConfirmationSlot', () => {
  it('starts with every question closed', () => {
    const slot = new ConfirmationSlot();

    expect(slot.openKey()).toBeNull();
    expect(slot.isOpen(4)).toBe(false);
  });

  it('keeps a single question open: opening another closes the first', () => {
    const slot = new ConfirmationSlot();

    slot.set(4, true);
    slot.set(5, true);

    expect(slot.isOpen(5)).toBe(true);
    expect(slot.isOpen(4)).toBe(false);
  });

  it('ignores the closing of a question that is no longer open', () => {
    const slot = new ConfirmationSlot();
    slot.set(4, true);
    slot.set(5, true);

    slot.set(4, false);

    expect(slot.openKey()).toBe(5);
  });

  it('closes the open question', () => {
    const slot = new ConfirmationSlot();
    slot.set(4, true);

    slot.set(4, false);

    expect(slot.openKey()).toBeNull();
  });

  it('closes whatever is open, for a list that loads again', () => {
    const slot = new ConfirmationSlot<string>();
    slot.set('product-10', true);

    slot.close();

    expect(slot.openKey()).toBeNull();
  });
});
