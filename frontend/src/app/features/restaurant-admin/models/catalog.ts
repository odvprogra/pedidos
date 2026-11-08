export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface CatalogCategory extends Category {
  products: Product[];
}

export interface Catalog {
  categories: CatalogCategory[];
}

export interface ProductDraft {
  categoryId: number;
  name: string;
  description: string;
  price: number;
}

export function addCategory(catalog: Catalog, category: Category): Catalog {
  return { categories: [...catalog.categories, { ...category, products: [] }] };
}

export function renameCategory(catalog: Catalog, category: Category): Catalog {
  return {
    categories: catalog.categories.map((current) =>
      current.id === category.id ? { ...current, name: category.name } : current,
    ),
  };
}

export function removeCategory(catalog: Catalog, categoryId: number): Catalog {
  return { categories: catalog.categories.filter((category) => category.id !== categoryId) };
}

export function putProduct(catalog: Catalog, product: Product): Catalog {
  return {
    categories: catalog.categories.map((category) => {
      const others = category.products.filter((current) => current.id !== product.id);
      if (category.id !== product.categoryId) {
        return others.length === category.products.length
          ? category
          : { ...category, products: others };
      }
      return { ...category, products: [...others, product].sort((a, b) => a.id - b.id) };
    }),
  };
}

export function removeProduct(catalog: Catalog, productId: number): Catalog {
  return {
    categories: catalog.categories.map((category) => ({
      ...category,
      products: category.products.filter((product) => product.id !== productId),
    })),
  };
}

export function summarize(catalog: Catalog): string {
  const categories = catalog.categories.length;
  const products = catalog.categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );
  if (products === 0) {
    return 'Todavía no tiene productos';
  }
  return `${count(categories, 'categoría', 'categorías')} · ${count(products, 'producto', 'productos')}`;
}

export function countProducts(total: number): string {
  return count(total, 'producto', 'productos');
}

function count(total: number, singular: string, plural: string): string {
  return `${total} ${total === 1 ? singular : plural}`;
}
