package com.nur.pedidos.order.infrastructure.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nur.pedidos.catalog.application.GetVisibleCatalogUseCase;
import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.ProductSnapshot;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProductCatalogAdapterTest {

    private final GetVisibleCatalogUseCase getVisibleCatalog = mock(GetVisibleCatalogUseCase.class);
    private final ProductCatalogAdapter catalog = new ProductCatalogAdapter(getVisibleCatalog);

    @Test
    void givesTheIdTheNameThePriceAndTheAvailabilityOfEachProductOnTheMenu() {
        Category mainDishes = new Category(3L, 4L, "Platos fuertes");
        when(getVisibleCatalog.execute(4L))
                .thenReturn(new Catalog(
                        List.of(mainDishes),
                        List.of(
                                new Product(10L, 4L, 3L, "Silpancho", "Con huevo", new BigDecimal("45.00"), true),
                                new Product(11L, 4L, 3L, "Pique macho", null, new BigDecimal("60.00"), false))));

        assertThat(catalog.productsOf(4L))
                .containsExactly(
                        new ProductSnapshot(10L, "Silpancho", new BigDecimal("45.00"), true),
                        new ProductSnapshot(11L, "Pique macho", new BigDecimal("60.00"), false));
    }

    @Test
    void turnsAHiddenRestaurantIntoAnUnavailableOne() {
        when(getVisibleCatalog.execute(4L)).thenThrow(new RestaurantNotFoundException());

        assertThatThrownBy(() -> catalog.productsOf(4L))
                .isInstanceOf(RestaurantUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.restaurant_unavailable");
    }
}
