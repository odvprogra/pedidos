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

class DeleteProductUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final DeleteProductUseCase deleteProduct = new DeleteProductUseCase(restaurantDirectory, productRepository);

    private Category mainDishes;

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
        mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
    }

    @Test
    void deletesAProductOfTheOwner() {
        Product silpancho = productRepository.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN));
        Product piqueMacho = productRepository.save(Product.create(mainDishes, "Pique macho", null, BigDecimal.TEN));

        deleteProduct.execute(OWNER, silpancho.getId());

        assertThat(productRepository.contains(silpancho.getId())).isFalse();
        assertThat(productRepository.contains(piqueMacho.getId())).isTrue();
    }

    @Test
    void refusesToDeleteAProductOfAnotherRestaurant() {
        Category foreignCategory = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        Product foreign = productRepository.save(Product.create(foreignCategory, "Napolitana", null, BigDecimal.TEN));

        assertThatThrownBy(() -> deleteProduct.execute(OWNER, foreign.getId()))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(productRepository.contains(foreign.getId())).isTrue();
    }

    @Test
    void failsWhenTheProductDoesNotExist() {
        assertThatThrownBy(() -> deleteProduct.execute(OWNER, 99L))
                .isInstanceOf(ProductNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.product_not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Product silpancho = productRepository.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN));

        assertThatThrownBy(() -> deleteProduct.execute(9L, silpancho.getId()))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(productRepository.contains(silpancho.getId())).isTrue();
    }
}
