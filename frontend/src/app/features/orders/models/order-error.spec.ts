import { describeOrderError, isInvalidTransition, isOrderMissing } from './order-error';

describe('the order errors', () => {
  it('treats an order that does not exist or belongs to another customer as missing', () => {
    expect(isOrderMissing({ status: 404, detail: '', code: 'order.not_found' })).toBe(true);
    expect(isOrderMissing({ status: 403, detail: '', code: 'order.not_owner' })).toBe(true);
  });

  it('does not treat other errors as a missing order', () => {
    expect(isOrderMissing({ status: 403, detail: '', code: 'access_denied' })).toBe(false);
    expect(isOrderMissing({ status: 500, detail: '' })).toBe(false);
  });

  it('recognizes an order that already changed its status', () => {
    expect(isInvalidTransition({ status: 409, detail: '', code: 'order.invalid_transition' })).toBe(
      true,
    );
    expect(isInvalidTransition({ status: 409, detail: '', code: 'restaurant.suspended' })).toBe(
      false,
    );
  });

  it('explains the errors it knows in its own words', () => {
    expect(describeOrderError({ status: 403, detail: 'Forbidden', code: 'access_denied' })).toBe(
      'Solo las cuentas de cliente tienen pedidos.',
    );
  });

  it('shows the detail of the backend for the errors it does not know', () => {
    expect(
      describeOrderError({
        status: 500,
        detail: 'Algo salió mal de nuestro lado. Intenta de nuevo en un momento.',
      }),
    ).toBe('Algo salió mal de nuestro lado. Intenta de nuevo en un momento.');
  });
});
