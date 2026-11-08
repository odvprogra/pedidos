package com.nur.pedidos.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.exception.ProductNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EditProductUseCaseTest {

    private static final Long OWNER = 7L;
    private static final Long RESTAURANT = 4L;
    private static final Long OTHER_RESTAURANT = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryCategoryRepository categoryRepository = new InMemoryCategoryRepository();
    private final InMemoryProductRepository productRepository = new InMemoryProductRepository();
    private final EditProductUseCase editProduct =
            new EditProductUseCase(restaurantDirectory, categoryRepository, productRepository);

    private Category mainDishes;
    private Category drinks;
    private Product silpancho;

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, RESTAURANT);
        mainDishes = categoryRepository.save(Category.create(RESTAURANT, "Platos fuertes"));
        drinks = categoryRepository.save(Category.create(RESTAURANT, "Bebidas"));
        Product soldOut = Product.create(mainDishes, "Silpancho", "Con arroz", new BigDecimal("45"));
        soldOut.markSoldOut();
        silpancho = productRepository.save(soldOut);
    }

    @Test
    void editsTheProductAndKeepsItsAvailability() {
        Product edited = editProduct.execute(new EditProductCommand(
                OWNER, silpancho.getId(), mainDishes.getId(), "Silpancho doble", null, new BigDecimal("60")));

        assertThat(edited.getName()).isEqualTo("Silpancho doble");
        assertThat(productRepository.get(silpancho.getId()))
                .extracting(Product::getName, Product::getDescription, Product::getPrice, Product::isAvailable)
                .containsExactly("Silpancho doble", null, new BigDecimal("60.00"), false);
    }

    @Test
    void movesTheProductToAnotherCategoryOfTheRestaurant() {
        editProduct.execute(new EditProductCommand(
                OWNER, silpancho.getId(), drinks.getId(), "Silpancho", null, new BigDecimal("45")));

        assertThat(productRepository.get(silpancho.getId()).getCategoryId()).isEqualTo(drinks.getId());
    }

    @Test
    void refusesToEditAProductOfAnotherRestaurant() {
        Category foreignCategory = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));
        Product foreign =
                productRepository.save(Product.create(foreignCategory, "Napolitana", null, new BigDecimal("70")));

        assertThatThrownBy(() -> editProduct.execute(new EditProductCommand(
                        OWNER, foreign.getId(), mainDishes.getId(), "Mía", null, new BigDecimal("1"))))
                .isInstanceOf(CatalogNotOwnerException.class)
                .extracting("code")
                .isEqualTo("catalog.not_owner");
        assertThat(productRepository.get(foreign.getId()).getName()).isEqualTo("Napolitana");
    }

    @Test
    void refusesToMoveTheProductToACategoryOfAnotherRestaurant() {
        Category foreignCategory = categoryRepository.save(Category.create(OTHER_RESTAURANT, "Pizzas"));

        assertThatThrownBy(() -> editProduct.execute(new EditProductCommand(
                        OWNER, silpancho.getId(), foreignCategory.getId(), "Silpancho", null, new BigDecimal("45"))))
                .isInstanceOf(CatalogNotOwnerException.class);
        assertThat(productRepository.get(silpancho.getId()).getCategoryId()).isEqualTo(mainDishes.getId());
    }

    @Test
    void failsWhenTheProductDoesNotExist() {
        assertThatThrownBy(() -> editProduct.execute(
                        new EditProductCommand(OWNER, 99L, mainDishes.getId(), "Silpancho", null, BigDecimal.TEN)))
                .isInstanceOf(ProductNotFoundException.class)
                .extracting("code")
                .isEqualTo("catalog.product_not_found");
    }

    @Test
    void failsWhenTheNewCategoryDoesNotExist() {
        assertThatThrownBy(() -> editProduct.execute(
                        new EditProductCommand(OWNER, silpancho.getId(), 99L, "Silpancho", null, BigDecimal.TEN)))
                .isInstanceOf(CategoryNotFoundException.class);
        assertThat(productRepository.get(silpancho.getId()).getCategoryId()).isEqualTo(mainDishes.getId());
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        assertThatThrownBy(() -> editProduct.execute(new EditProductCommand(
                        9L, silpancho.getId(), mainDishes.getId(), "Silpancho", null, BigDecimal.TEN)))
                .isInstanceOf(RestaurantNotFoundException.class);
        assertThat(productRepository.get(silpancho.getId()).getPrice()).isEqualTo(new BigDecimal("45.00"));
    }
}
