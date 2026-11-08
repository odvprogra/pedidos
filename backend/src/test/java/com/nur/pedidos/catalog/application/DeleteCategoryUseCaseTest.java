package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotEmptyException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeleteCategoryUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final DeleteCategoryUseCase deleteCategory =
            new DeleteCategoryUseCase(restaurantDirectory, categoryRepository, productRepository);

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
    }

    @Test
    void deletesAnEmptyCategoryOfTheOwner() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        Category desserts = categoryRepository.save(Category.create(RESTAURANT, "Postres"));

        deleteCategory.execute(OWNER, drinks.getId());

        assertThat(categoryRepository.contains(drinks.getId())).isFalse();
        assertThat(categoryRepository.contains(desserts.getId())).isTrue();
    }

    @Test
    void refusesToDeleteACategoryWithProducts() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        productRepository.save(Product.create(drinks, "Limonada", null, new BigDecimal("15")));

        assertThatThrownBy(() -> deleteCategory.execute(OWNER, drinks.getId()))
                .isInstanceOf(CategoryNotEmptyException.class)
                .extracting("code")
                .isEqualTo("catalog.category_not_empty");
        assertThat(categoryRepository.contains(drinks.getId())).isTrue();
    }

    @Test
    void refusesToDeleteACategoryWhoseProductsAreSoldOut() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        Product lemonade = Product.create(drinks, "Limonada", null, new BigDecimal("15"));
        lemonade.markSoldOut();
        productRepository.save(lemonade);

        assertThatThrownBy(() -> deleteCategory.execute(OWNER, drinks.getId()))
                .isInstanceOf(CategoryNotEmptyException.class);
        assertThat(categoryRepository.contains(drinks.getId())).isTrue();
    }

    @Test
    void refusesToDeleteACategoryOfAnotherRestaurant() {
        Category foreign = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));

        assertThatThrownBy(() -> deleteCategory.execute(OWNER, foreign.getId()))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(categoryRepository.contains(foreign.getId())).isTrue();
    }

    @Test
    void failsWhenTheCategoryDoesNotExist() {
        assertThatThrownBy(() -> deleteCategory.execute(OWNER, 99L))
                .isInstanceOf(CategoryNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.category_not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        assertThatThrownBy(() -> deleteCategory.execute(9L, drinks.getId()))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(categoryRepository.contains(drinks.getId())).isTrue();
    }
}
