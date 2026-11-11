import {
  Catalog,
  Product,
  addCategory,
  putProduct,
  removeCategory,
  removeProduct,
  renameCategory,
  summarize,
} from './catalog';

function product(id: number, categoryId: number, name: string): Product {
  return { id, categoryId, name, description: null, price: 20, available: true };
}

const SILPANCHO = product(10, 3, 'Silpancho');
const PIQUE_MACHO = product(12, 3, 'Pique macho');
const LEMONADE = product(11, 5, 'Limonada');

const MENU: Catalog = {
  categories: [
    { id: 3, name: 'Platos fuertes', products: [SILPANCHO, PIQUE_MACHO] },
    { id: 5, name: 'Bebidas', products: [LEMONADE] },
  ],
};

function namesIn(catalog: Catalog, categoryId: number): string[] {
  return (
    catalog.categories
      .find((category) => category.id === categoryId)
      ?.products.map((current) => current.name) ?? []
  );
}

describe('the menu changes', () => {
  it('adds a new category empty at the end', () => {
    const menu = addCategory(MENU, { id: 6, name: 'Postres' });

    expect(menu.categories.map((category) => category.name)).toEqual([
      'Platos fuertes',
      'Bebidas',
      'Postres',
    ]);
    expect(menu.categories[2].products).toEqual([]);
  });

  it('renames a category and keeps its products', () => {
    const menu = renameCategory(MENU, { id: 5, name: 'Refrescos' });

    expect(menu.categories[1].name).toBe('Refrescos');
    expect(namesIn(menu, 5)).toEqual(['Limonada']);
  });

  it('removes a category', () => {
    expect(removeCategory(MENU, 3).categories.map((category) => category.id)).toEqual([5]);
  });

  it('adds a new product to its category', () => {
    const menu = putProduct(MENU, product(13, 5, 'Mocochinchi'));

    expect(namesIn(menu, 5)).toEqual(['Limonada', 'Mocochinchi']);
    expect(namesIn(menu, 3)).toEqual(['Silpancho', 'Pique macho']);
  });

  it('replaces an edited product in its place', () => {
    const menu = putProduct(MENU, { ...SILPANCHO, name: 'Silpancho doble' });

    expect(namesIn(menu, 3)).toEqual(['Silpancho doble', 'Pique macho']);
  });

  it('moves a product to its new category in the order it was created', () => {
    const menu = putProduct(MENU, { ...PIQUE_MACHO, categoryId: 5 });

    expect(namesIn(menu, 3)).toEqual(['Silpancho']);
    expect(namesIn(menu, 5)).toEqual(['Limonada', 'Pique macho']);
  });

  it('removes a product', () => {
    const menu = removeProduct(MENU, 10);

    expect(namesIn(menu, 3)).toEqual(['Pique macho']);
    expect(namesIn(menu, 5)).toEqual(['Limonada']);
  });
});

describe('summarize', () => {
  it.each([
    ['an empty menu', { categories: [] }, 'Todavía no tiene productos'],
    [
      'categories without products',
      { categories: [{ id: 3, name: 'Platos fuertes', products: [] }] },
      'Todavía no tiene productos',
    ],
    [
      'one category with one product',
      { categories: [{ id: 3, name: 'Platos fuertes', products: [SILPANCHO] }] },
      '1 categoría · 1 producto',
    ],
    ['a full menu', MENU, '2 categorías · 3 productos'],
  ])('describes %s', (_case, catalog, summary) => {
    expect(summarize(catalog)).toBe(summary);
  });
});
