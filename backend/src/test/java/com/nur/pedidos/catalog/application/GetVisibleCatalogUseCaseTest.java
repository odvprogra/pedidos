package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetVisibleCatalogUseCaseTest {

    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final GetVisibleCatalogUseCase getVisibleCatalog =
            new GetVisibleCatalogUseCase(restaurantDirectory, categoryRepository, productRepository);

    @BeforeEach
    void registerRestaurants() {
        restaurantDirectory.register(7L, RESTAURANT);
        restaurantDirectory.register(8L, OTHER_RESTAURANT);
    }

    @Test
    void returnsTheCategoriesOfTheRestaurantWithTheirProducts() {
        Category mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        Category foreign = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        productRepository.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45")));
        productRepository.save(Product.create(drinks, "Limonada", null, new BigDecimal("10")));
        productRepository.save(Product.create(foreign, "Napolitana", null, new BigDecimal("70")));

        Catalog catalog = getVisibleCatalog.execute(RESTAURANT);

        assertThat(catalog.categories()).extracting(Category::getName).containsExactly("Platos fuertes", "Bebidas");
        assertThat(catalog.productsIn(mainDishes)).extracting(Product::getName).containsExactly("Silpancho");
        assertThat(catalog.products()).extracting(Product::getName).doesNotContain("Napolitana");
    }

    @Test
    void keepsTheSoldOutProductsInTheirPlace() {
        Category mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        productRepository.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45")));
        Product piqueMacho = Product.create(mainDishes, "Pique macho", null, new BigDecimal("60"));
        piqueMacho.markSoldOut();
        productRepository.save(piqueMacho);

        Catalog catalog = getVisibleCatalog.execute(RESTAURANT);

        assertThat(catalog.productsIn(mainDishes))
                .extracting(Product::getName, Product::isAvailable)
                .containsExactly(tuple("Silpancho", true), tuple("Pique macho", false));
    }

    @Test
    void leavesOutTheCategoriesWithoutProducts() {
        Category mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        productRepository.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45")));

        Catalog catalog = getVisibleCatalog.execute(RESTAURANT);

        assertThat(catalog.categories()).extracting(Category::getName).containsExactly("Platos fuertes");
    }

    @Test
    void returnsAnEmptyCatalogWhenTheRestaurantHasNoProductsYet() {
        categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        Catalog catalog = getVisibleCatalog.execute(RESTAURANT);

        assertThat(catalog.categories()).isEmpty();
        assertThat(catalog.products()).isEmpty();
    }

    @Test
    void hidesTheCatalogOfASuspendedRestaurant() {
        Category mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        productRepository.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45")));
        restaurantDirectory.suspend(RESTAURANT);

        assertThatThrownBy(() -> getVisibleCatalog.execute(RESTAURANT))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void failsWhenTheRestaurantDoesNotExist() {
        assertThatThrownBy(() -> getVisibleCatalog.execute(99L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }
}
