package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CategoryNameTakenException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CreateCategoryUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final CreateCategoryUseCase createCategory =
            new CreateCategoryUseCase(restaurantDirectory, categoryRepository);

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
    }

    @Test
    void createsACategoryInTheRestaurantOfTheOwner() {
        Category category = createCategory.execute(new CreateCategoryCommand(OWNER, "  Bebidas "));

        assertThat(category.getId()).isNotNull();
        assertThat(category.getRestaurantId()).isEqualTo(RESTAURANT);
        assertThat(category.getName()).isEqualTo("Bebidas");
        assertThat(categoryRepository.nameOf(category.getId())).isEqualTo("Bebidas");
    }

    @ParameterizedTest
    @ValueSource(strings = {"Bebidas", "BEBIDAS", "  bebidas "})
    void refusesANameTheRestaurantAlreadyUsesIgnoringCase(String name) {
        categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        assertThatThrownBy(() -> createCategory.execute(new CreateCategoryCommand(OWNER, name)))
                .isInstanceOf(CategoryNameTakenException.class)
                .extracting("code")
                .isEqualTo("catalog.category_name_taken");
        assertThat(categoryRepository.count()).isOne();
    }

    @Test
    void acceptsANameThatAnotherRestaurantUses() {
        categoryRepository.save(Category.create(OTHER_RESTAURANT, "Bebidas"));

        Category category = createCategory.execute(new CreateCategoryCommand(OWNER, "Bebidas"));

        assertThat(category.getRestaurantId()).isEqualTo(RESTAURANT);
        assertThat(categoryRepository.count()).isEqualTo(2);
    }

    @Test
    void refusesABlankName() {
        assertThatThrownBy(() -> createCategory.execute(new CreateCategoryCommand(OWNER, "   ")))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.category_name_required");
        assertThat(categoryRepository.count()).isZero();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        assertThatThrownBy(() -> createCategory.execute(new CreateCategoryCommand(9L, "Bebidas")))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(categoryRepository.count()).isZero();
    }
}
