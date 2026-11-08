package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CreateProductUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final CreateProductUseCase createProduct =
            new CreateProductUseCase(restaurantDirectory, categoryRepository, productRepository);

    private Category mainDishes;

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
        mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
    }

    @Test
    void createsAnAvailableProductInACategoryOfTheOwner() {
        Product product = createProduct.execute(
                new CreateProductCommand(OWNER, mainDishes.getId(), "Silpancho", "Con arroz", new BigDecimal("45")));

        assertThat(productRepository.get(product.getId()))
                .extracting(
                        Product::getRestaurantId,
                        Product::getCategoryId,
                        Product::getName,
                        Product::getDescription,
                        Product::getPrice,
                        Product::isAvailable)
                .containsExactly(
                        RESTAURANT, mainDishes.getId(), "Silpancho", "Con arroz", new BigDecimal("45.00"), true);
    }

    @Test
    void refusesACategoryOfAnotherRestaurant() {
        Category foreign = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));

        assertThatThrownBy(() -> createProduct.execute(
                        new CreateProductCommand(OWNER, foreign.getId(), "Napolitana", null, new BigDecimal("70"))))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(productRepository.count()).isZero();
    }

    @Test
    void failsWhenTheCategoryDoesNotExist() {
        assertThatThrownBy(() -> createProduct.execute(
                        new CreateProductCommand(OWNER, 99L, "Silpancho", null, new BigDecimal("45"))))
                .isInstanceOf(CategoryNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.category_not_found");
        assertThat(productRepository.count()).isZero();
    }

    @Test
    void refusesAPriceThatIsNotPositive() {
        assertThatThrownBy(() -> createProduct.execute(
                        new CreateProductCommand(OWNER, mainDishes.getId(), "Silpancho", null, BigDecimal.ZERO)))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.price_not_positive");
        assertThat(productRepository.count()).isZero();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        assertThatThrownBy(() -> createProduct.execute(
                        new CreateProductCommand(9L, mainDishes.getId(), "Silpancho", null, new BigDecimal("45"))))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(productRepository.count()).isZero();
    }
}
