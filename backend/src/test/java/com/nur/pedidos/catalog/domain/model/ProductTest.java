package com.nur.pedidos.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class ProductTest {

    private static final Category MAIN_DISHES = new Category(3L, 4L, "Platos fuertes");
    private static final Category DRINKS = new Category(5L, 4L, "Bebidas");

    @Test
    void createsAnAvailableProductInTheRestaurantOfItsCategory() {
        Product product = Product.create(MAIN_DISHES, "  Silpancho ", "  Con arroz y huevo  ", new BigDecimal("45.5"));

        assertThat(product.getId()).isNull();
        assertThat(product.getRestaurantId()).isEqualTo(4L);
        assertThat(product.getCategoryId()).isEqualTo(3L);
        assertThat(product.getName()).isEqualTo("Silpancho");
        assertThat(product.getDescription()).isEqualTo("Con arroz y huevo");
        assertThat(product.getPrice()).isEqualTo(new BigDecimal("45.50"));
        assertThat(product.isAvailable()).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void createsAProductWithoutDescriptionWhenItIsBlank(String description) {
        Product product = Product.create(MAIN_DISHES, "Silpancho", description, BigDecimal.TEN);

        assertThat(product.getDescription()).isNull();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankName(String name) {
        assertThatThrownBy(() -> Product.create(MAIN_DISHES, name, null, BigDecimal.TEN))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.product_name_required");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"0", "0.00", "-1", "0.004"})
    void rejectsAPriceThatIsNotPositive(BigDecimal price) {
        assertThatThrownBy(() -> Product.create(MAIN_DISHES, "Silpancho", null, price))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.price_not_positive");
    }

    @ParameterizedTest
    @CsvSource({"45, 45.00", "0.01, 0.01", "0.005, 0.01", "12.345, 12.35"})
    void keepsThePriceWithTwoDecimals(String price, String kept) {
        Product product = Product.create(MAIN_DISHES, "Silpancho", null, new BigDecimal(price));

        assertThat(product.getPrice()).isEqualTo(new BigDecimal(kept));
    }

    @Test
    void editsTheProductAndMovesItToAnotherCategory() {
        Product product = silpancho(true);

        product.edit(DRINKS, " Limonada ", " Jarra de un litro ", new BigDecimal("20"));

        assertThat(product.getCategoryId()).isEqualTo(5L);
        assertThat(product.getName()).isEqualTo("Limonada");
        assertThat(product.getDescription()).isEqualTo("Jarra de un litro");
        assertThat(product.getPrice()).isEqualTo(new BigDecimal("20.00"));
    }

    @Test
    void keepsTheAvailabilityWhenEditing() {
        Product product = silpancho(false);

        product.edit(MAIN_DISHES, "Silpancho", null, new BigDecimal("48"));

        assertThat(product.isAvailable()).isFalse();
    }

    @Test
    void removesTheDescriptionWhenEditingWithABlankOne() {
        Product product = silpancho(true);

        product.edit(MAIN_DISHES, "Silpancho", "  ", new BigDecimal("45"));

        assertThat(product.getDescription()).isNull();
    }

    @Test
    void keepsTheProductUnchangedWhenTheEditBreaksARule() {
        Product product = silpancho(true);

        assertThatThrownBy(() -> product.edit(DRINKS, "Limonada", null, BigDecimal.ZERO))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.price_not_positive");
        assertThat(product)
                .extracting(Product::getCategoryId, Product::getName, Product::getDescription, Product::getPrice)
                .containsExactly(3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.00"));
    }

    @Test
    void marksAnAvailableProductAsSoldOut() {
        Product product = silpancho(true);

        product.markSoldOut();

        assertThat(product.isAvailable()).isFalse();
    }

    @Test
    void keepsASoldOutProductSoldOut() {
        Product product = silpancho(false);

        product.markSoldOut();

        assertThat(product.isAvailable()).isFalse();
    }

    @Test
    void marksASoldOutProductAsAvailable() {
        Product product = silpancho(false);

        product.markAvailable();

        assertThat(product.isAvailable()).isTrue();
    }

    @Test
    void keepsAnAvailableProductAvailable() {
        Product product = silpancho(true);

        product.markAvailable();

        assertThat(product.isAvailable()).isTrue();
    }

    @Test
    void belongsOnlyToItsRestaurant() {
        Product product = silpancho(true);

        assertThat(product.belongsTo(4L)).isTrue();
        assertThat(product.belongsTo(5L)).isFalse();
    }

    private static Product silpancho(boolean available) {
        return new Product(10L, 4L, 3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.00"), available);
    }
}
