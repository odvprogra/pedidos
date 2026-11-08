package com.nur.pedidos.catalog.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.catalog.domain.model.Category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, CategoryPersistenceAdapter.class})
class CategoryPersistenceAdapterTest {

    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    @Autowired
    private CategoryPersistenceAdapter adapter;

    @Test
    void savesAndLoadsACategory() {
        Category saved = adapter.save(Category.create(RESTAURANT, "Bebidas"));

        assertThat(saved.getId()).isNotNull();
        assertThat(adapter.findById(saved.getId()))
                .get()
                .extracting(Category::getRestaurantId, Category::getName)
                .containsExactly(RESTAURANT, "Bebidas");
    }

    @Test
    void findsNothingWhenTheCategoryDoesNotExist() {
        assertThat(adapter.findById(999_999L)).isEmpty();
    }

    @Test
    void listsOnlyTheCategoriesOfTheRestaurantInTheOrderTheyWereCreated() {
        adapter.save(Category.create(RESTAURANT, "Platos fuertes"));
        adapter.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        adapter.save(Category.create(RESTAURANT, "Bebidas"));
        adapter.save(Category.create(RESTAURANT, "Antojitos"));

        assertThat(adapter.findAllByRestaurantId(RESTAURANT))
                .extracting(Category::getName)
                .containsExactly("Platos fuertes", "Bebidas", "Antojitos");
    }

    @Test
    void findsACategoryOfTheRestaurantByNameIgnoringCase() {
        Category drinks = adapter.save(Category.create(RESTAURANT, "Bebidas"));
        adapter.save(Category.create(OTHER_RESTAURANT, "Postres"));

        assertThat(adapter.findByRestaurantIdAndNameIgnoringCase(RESTAURANT, "BEBIDAS"))
                .get()
                .extracting(Category::getId)
                .isEqualTo(drinks.getId());
        assertThat(adapter.findByRestaurantIdAndNameIgnoringCase(RESTAURANT, "Postres"))
                .isEmpty();
    }

    @Test
    void keepsTheNewNameOfACategory() {
        Category drinks = adapter.save(Category.create(RESTAURANT, "Bebidas"));
        drinks.rename("Refrescos");

        adapter.save(drinks);

        assertThat(adapter.findById(drinks.getId()))
                .get()
                .extracting(Category::getName)
                .isEqualTo("Refrescos");
    }

    @Test
    void deletesACategory() {
        Category drinks = adapter.save(Category.create(RESTAURANT, "Bebidas"));

        adapter.deleteById(drinks.getId());

        assertThat(adapter.findById(drinks.getId())).isEmpty();
    }

    @Test
    void rejectsARepeatedNameInAnotherCapitalizationInTheSameRestaurant() {
        adapter.save(Category.create(RESTAURANT, "Bebidas"));

        assertThatThrownBy(() -> adapter.save(Category.create(RESTAURANT, "BEBIDAS")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void acceptsTheSameNameInAnotherRestaurant() {
        adapter.save(Category.create(RESTAURANT, "Bebidas"));

        Category saved = adapter.save(Category.create(OTHER_RESTAURANT, "Bebidas"));

        assertThat(saved.getId()).isNotNull();
    }
}
