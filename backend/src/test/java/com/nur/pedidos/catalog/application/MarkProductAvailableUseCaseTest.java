package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.ProductNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MarkProductAvailableUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final MarkProductAvailableUseCase markAvailable =
            new MarkProductAvailableUseCase(restaurantDirectory, productRepository);

    private Category mainDishes;

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
        mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
    }

    @Test
    void marksOnlyThatProductAsAvailable() {
        Product silpancho = productRepository.save(soldOut(mainDishes, "Silpancho"));
        Product piqueMacho = productRepository.save(soldOut(mainDishes, "Pique macho"));

        markAvailable.execute(OWNER, silpancho.getId());

        assertThat(productRepository.get(silpancho.getId()).isAvailable()).isTrue();
        assertThat(productRepository.get(piqueMacho.getId()).isAvailable()).isFalse();
    }

    @Test
    void acceptsMarkingAnAvailableProductAgain() {
        Product silpancho = productRepository.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN, null));

        markAvailable.execute(OWNER, silpancho.getId());

        assertThat(productRepository.get(silpancho.getId()).isAvailable()).isTrue();
    }

    @Test
    void refusesAProductOfAnotherRestaurant() {
        Category foreignCategory = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        Product foreign = productRepository.save(soldOut(foreignCategory, "Napolitana"));

        assertThatThrownBy(() -> markAvailable.execute(OWNER, foreign.getId()))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(productRepository.get(foreign.getId()).isAvailable()).isFalse();
    }

    @Test
    void failsWhenTheProductDoesNotExist() {
        assertThatThrownBy(() -> markAvailable.execute(OWNER, 99L))
                .isInstanceOf(ProductNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.product_not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Product silpancho = productRepository.save(soldOut(mainDishes, "Silpancho"));

        assertThatThrownBy(() -> markAvailable.execute(9L, silpancho.getId()))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(productRepository.get(silpancho.getId()).isAvailable()).isFalse();
    }

    private static Product soldOut(Category category, String name) {
        Product product = Product.create(category, name, null, BigDecimal.TEN, null);
        product.markSoldOut();
        return product;
    }
}
