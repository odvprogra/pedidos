export type RestaurantCategory =
  'TRADITIONAL' | 'GRILL' | 'CHICKEN' | 'PIZZA' | 'BURGERS' | 'SUSHI' | 'CAFE' | 'OTHER';

export const RESTAURANT_CATEGORY_LABELS: Record<RestaurantCategory, string> = {
  TRADITIONAL: 'Comida típica',
  GRILL: 'Parrillas',
  CHICKEN: 'Pollos',
  PIZZA: 'Pizzas',
  BURGERS: 'Hamburguesas',
  SUSHI: 'Sushi',
  CAFE: 'Cafeterías',
  OTHER: 'Otros',
};

export const RESTAURANT_CATEGORIES = Object.keys(
  RESTAURANT_CATEGORY_LABELS,
) as RestaurantCategory[];
