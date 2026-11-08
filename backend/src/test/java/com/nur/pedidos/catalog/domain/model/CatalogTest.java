package com.nur.pedidos.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class CatalogTest {

    private static final Category MAIN_DISHES = new Category(3L, 4L, "Platos fuertes");
    private static final Category DRINKS = new Category(5L, 4L, "Bebidas");
    private static final Category DESSERTS = new Category(6L, 4L, "Postres");

    @Test
    void groupsTheProductsByCategoryKeepingTheirOrder() {
        Product silpancho = product(10L, MAIN_DISHES, "Silpancho");
        Product lemonade = product(11L, DRINKS, "Limonada");
        Product piqueMacho = product(12L, MAIN_DISHES, "Pique macho");
        Catalog catalog = new Catalog(List.of(MAIN_DISHES, DRINKS, DESSERTS), List.of(silpancho, lemonade, piqueMacho));

        assertThat(catalog.productsIn(MAIN_DISHES)).containsExactly(silpancho, piqueMacho);
        assertThat(catalog.productsIn(DRINKS)).containsExactly(lemonade);
        assertThat(catalog.productsIn(DESSERTS)).isEmpty();
    }

    @Test
    void keepsItsOwnCopyOfTheLists() {
        List<Category> categories = new ArrayList<>(List.of(MAIN_DISHES));
        Catalog catalog = new Catalog(categories, List.of());

        categories.add(DRINKS);

        assertThat(catalog.categories()).containsExactly(MAIN_DISHES);
    }

    private static Product product(Long id, Category category, String name) {
        return new Product(id, 4L, category.getId(), name, null, new BigDecimal("20.00"), true);
    }
}
