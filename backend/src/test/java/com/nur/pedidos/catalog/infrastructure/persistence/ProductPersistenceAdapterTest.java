package com.nur.pedidos.catalog.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, CategoryPersistenceAdapter.class, ProductPersistenceAdapter.class})
class ProductPersistenceAdapterTest {

    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    @Autowired
    private ProductPersistenceAdapter adapter;

    @Autowired
    private CategoryPersistenceAdapter categories;

    @Autowired
    private CategoryJpaRepository categoryJpaRepository;

    private Category mainDishes;
    private Category drinks;

    @BeforeEach
    void createCategories() {
        mainDishes = categories.save(Category.create(RESTAURANT, "Platos fuertes"));
        drinks = categories.save(Category.create(RESTAURANT, "Bebidas"));
    }

    @Test
    void savesAndLoadsAProduct() {
        Product saved =
                adapter.save(Product.create(mainDishes, "Silpancho", "Con arroz y huevo", new BigDecimal("45"), null));

        assertThat(saved.getId()).isNotNull();
        assertThat(adapter.findById(saved.getId()))
                .get()
                .extracting(
                        Product::getRestaurantId,
                        Product::getCategoryId,
                        Product::getName,
                        Product::getDescription,
                        Product::getPrice,
                        Product::isAvailable)
                .containsExactly(
                        RESTAURANT,
                        mainDishes.getId(),
                        "Silpancho",
                        "Con arroz y huevo",
                        new BigDecimal("45.00"),
                        true);
    }

    @Test
    void savesTheImageOfAProduct() {
        Product saved = adapter.save(
                Product.create(mainDishes, "Silpancho", null, new BigDecimal("45.00"), "https://f.test/s.jpg"));

        assertThat(adapter.findById(saved.getId()))
                .get()
                .extracting(Product::getImageUrl)
                .isEqualTo("https://f.test/s.jpg");
    }

    @Test
    void keepsAProductWithoutDescription() {
        Product saved = adapter.save(Product.create(mainDishes, "Silpancho", null, new BigDecimal("45"), null));

        assertThat(adapter.findById(saved.getId()))
                .get()
                .extracting(Product::getDescription)
                .isNull();
    }

    @Test
    void findsNothingWhenTheProductDoesNotExist() {
        assertThat(adapter.findById(999_999L)).isEmpty();
    }

    @Test
    void listsOnlyTheProductsOfTheRestaurantInTheOrderTheyWereCreated() {
        Category foreign = categories.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        adapter.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN, null));
        adapter.save(Product.create(foreign, "Napolitana", null, BigDecimal.TEN, null));
        adapter.save(Product.create(drinks, "Limonada", null, BigDecimal.TEN, null));
        adapter.save(Product.create(mainDishes, "Pique macho", null, BigDecimal.TEN, null));

        assertThat(adapter.findAllByRestaurantId(RESTAURANT))
                .extracting(Product::getName)
                .containsExactly("Silpancho", "Limonada", "Pique macho");
    }

    @Test
    void tellsWhetherACategoryHasProducts() {
        adapter.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN, null));

        assertThat(adapter.existsByCategoryId(mainDishes.getId())).isTrue();
        assertThat(adapter.existsByCategoryId(drinks.getId())).isFalse();
    }

    @Test
    void keepsTheChangesOfAProduct() {
        Product product = adapter.save(Product.create(mainDishes, "Silpancho", "Con arroz", BigDecimal.TEN, null));
        product.edit(drinks, "Limonada", null, new BigDecimal("15.50"), null);
        product.markSoldOut();

        adapter.save(product);

        assertThat(adapter.findById(product.getId()))
                .get()
                .extracting(
                        Product::getCategoryId,
                        Product::getName,
                        Product::getDescription,
                        Product::getPrice,
                        Product::isAvailable)
                .containsExactly(drinks.getId(), "Limonada", null, new BigDecimal("15.50"), false);
    }

    @Test
    void deletesAProduct() {
        Product product = adapter.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN, null));

        adapter.deleteById(product.getId());

        assertThat(adapter.findById(product.getId())).isEmpty();
    }

    @Test
    void rejectsAPriceOfZero() {
        Product free =
                new Product(null, RESTAURANT, mainDishes.getId(), "Silpancho", null, BigDecimal.ZERO, true, null);

        assertThatThrownBy(() -> adapter.save(free)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsAProductInACategoryThatDoesNotExist() {
        Product orphan = new Product(null, RESTAURANT, 999_999L, "Silpancho", null, BigDecimal.TEN, true, null);

        assertThatThrownBy(() -> adapter.save(orphan)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refusesToDeleteACategoryWithProducts() {
        adapter.save(Product.create(mainDishes, "Silpancho", null, BigDecimal.TEN, null));
        categories.deleteById(mainDishes.getId());

        assertThatThrownBy(categoryJpaRepository::flush).isInstanceOf(DataIntegrityViolationException.class);
    }
}
