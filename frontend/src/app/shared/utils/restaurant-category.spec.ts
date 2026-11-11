import { RESTAURANT_CATEGORIES, RESTAURANT_CATEGORY_LABELS } from './restaurant-category';

describe('the restaurant category', () => {
  it('names each category of the backend in Spanish', () => {
    expect(RESTAURANT_CATEGORY_LABELS).toEqual({
      TRADITIONAL: 'Comida típica',
      GRILL: 'Parrillas',
      CHICKEN: 'Pollos',
      PIZZA: 'Pizzas',
      BURGERS: 'Hamburguesas',
      SUSHI: 'Sushi',
      CAFE: 'Cafeterías',
      OTHER: 'Otros',
    });
  });

  it('offers the categories in the order of the list, with "Otros" last', () => {
    expect(RESTAURANT_CATEGORIES).toEqual([
      'TRADITIONAL',
      'GRILL',
      'CHICKEN',
      'PIZZA',
      'BURGERS',
      'SUSHI',
      'CAFE',
      'OTHER',
    ]);
  });
});
