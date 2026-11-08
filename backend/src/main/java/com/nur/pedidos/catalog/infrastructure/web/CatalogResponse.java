package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.domain.model.Catalog;
import java.util.List;

record CatalogResponse(List<Section> categories) {

    static CatalogResponse from(Catalog catalog) {
        return new CatalogResponse(catalog.categories().stream()
                .map(category -> new Section(
                        category.getId(),
                        category.getName(),
                        catalog.productsIn(category).stream()
                                .map(ProductResponse::from)
                                .toList()))
                .toList());
    }

    record Section(Long id, String name, List<ProductResponse> products) {}
}
