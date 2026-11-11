package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetOwnCatalogUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_OWNER = 8L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final GetOwnCatalogUseCase getOwnCatalog =
            new GetOwnCatalogUseCase(restaurantDirectory, categoryRepository, productRepository);

    @BeforeEach
    void registerRestaurants() {
        restaurantDirectory.register(OWNER, RESTAURANT);
        restaurantDirectory.register(OTHER_OWNER, OTHER_RESTAURANT);
    }

    @Test
    void returnsOnlyTheCategoriesAndProductsOfTheOwnRestaurant() {
        Category mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        Category foreign = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        productRepository.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45")));
        productRepository.save(Product.create(foreign, "Napolitana", null, new BigDecimal("70")));

        Catalog catalog = getOwnCatalog.execute(OWNER);

        assertThat(catalog.categories()).extracting(Category::getName).containsExactly("Platos fuertes", "Bebidas");
        assertThat(catalog.productsIn(mainDishes)).extracting(Product::getName).containsExactly("Silpancho");
        assertThat(catalog.productsIn(drinks)).isEmpty();
        assertThat(catalog.products()).extracting(Product::getName).doesNotContain("Napolitana");
    }

    @Test
    void returnsAnEmptyCatalogWhenNothingWasCreatedYet() {
        Catalog catalog = getOwnCatalog.execute(OWNER);

        assertThat(catalog.categories()).isEmpty();
        assertThat(catalog.products()).isEmpty();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        assertThatThrownBy(() -> getOwnCatalog.execute(9L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }
}
