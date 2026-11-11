import { isRestaurantMissing } from './restaurant-error';

describe('isRestaurantMissing', () => {
  it('recognizes a restaurant that is hidden or does not exist', () => {
    expect(isRestaurantMissing({ status: 404, code: 'restaurant.not_found', detail: 'x' })).toBe(
      true,
    );
  });

  it.each([
    ['a not found without code', { status: 404, detail: 'x' }],
    ['another not found', { status: 404, code: 'catalog.product_not_found', detail: 'x' }],
    ['a server error', { status: 500, detail: 'x' }],
    ['no connection', { status: 0, detail: 'x' }],
  ])('does not treat %s as a missing restaurant', (_case, problem) => {
    expect(isRestaurantMissing(problem)).toBe(false);
  });
});
