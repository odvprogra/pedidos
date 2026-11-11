export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  imageUrl: string | null;
}

export interface CatalogCategory {
  id: number;
  name: string;
  products: Product[];
}

export interface Catalog {
  categories: CatalogCategory[];
}
