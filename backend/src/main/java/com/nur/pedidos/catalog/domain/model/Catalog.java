package com.nur.pedidos.catalog.domain.model;

import java.util.List;

public record Catalog(List<Category> categories, List<Product> products) {

    public Catalog {
        categories = List.copyOf(categories);
        products = List.copyOf(products);
    }

    public List<Product> productsIn(Category category) {
        return products.stream()
                .filter(product -> product.getCategoryId().equals(category.getId()))
                .toList();
    }
}
