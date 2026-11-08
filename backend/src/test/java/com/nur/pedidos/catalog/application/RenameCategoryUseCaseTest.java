package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNameTakenException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RenameCategoryUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final RenameCategoryUseCase renameCategory =
            new RenameCategoryUseCase(restaurantDirectory, categoryRepository);

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
    }

    @Test
    void renamesACategoryOfTheOwner() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        Category renamed = renameCategory.execute(new RenameCategoryCommand(OWNER, drinks.getId(), " Refrescos "));

        assertThat(renamed.getName()).isEqualTo("Refrescos");
        assertThat(categoryRepository.nameOf(drinks.getId())).isEqualTo("Refrescos");
    }

    @Test
    void acceptsChangingOnlyTheCapitalizationOfItsOwnName() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "bebidas"));

        renameCategory.execute(new RenameCategoryCommand(OWNER, drinks.getId(), "Bebidas"));

        assertThat(categoryRepository.nameOf(drinks.getId())).isEqualTo("Bebidas");
    }

    @Test
    void refusesTheNameOfAnotherCategoryOfTheRestaurant() {
        categoryRepository.save(Category.create(RESTAURANT, "Postres"));
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        assertThatThrownBy(() -> renameCategory.execute(new RenameCategoryCommand(OWNER, drinks.getId(), "POSTRES")))
                .isInstanceOf(CategoryNameTakenException.class)
                .extracting("code")
                .isEqualTo("catalog.category_name_taken");
        assertThat(categoryRepository.nameOf(drinks.getId())).isEqualTo("Bebidas");
    }

    @Test
    void acceptsTheNameOfACategoryOfAnotherRestaurant() {
        categoryRepository.save(Category.create(OTHER_RESTAURANT, "Postres"));
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        renameCategory.execute(new RenameCategoryCommand(OWNER, drinks.getId(), "Postres"));

        assertThat(categoryRepository.nameOf(drinks.getId())).isEqualTo("Postres");
    }

    @Test
    void refusesToRenameACategoryOfAnotherRestaurant() {
        Category foreign = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));

        assertThatThrownBy(() -> renameCategory.execute(new RenameCategoryCommand(OWNER, foreign.getId(), "Mías")))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(categoryRepository.nameOf(foreign.getId())).isEqualTo("Pizzas");
    }

    @Test
    void failsWhenTheCategoryDoesNotExist() {
        assertThatThrownBy(() -> renameCategory.execute(new RenameCategoryCommand(OWNER, 99L, "Bebidas")))
                .isInstanceOf(CategoryNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.category_not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Category drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));

        assertThatThrownBy(() -> renameCategory.execute(new RenameCategoryCommand(9L, drinks.getId(), "Refrescos")))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(categoryRepository.nameOf(drinks.getId())).isEqualTo("Bebidas");
    }
}
