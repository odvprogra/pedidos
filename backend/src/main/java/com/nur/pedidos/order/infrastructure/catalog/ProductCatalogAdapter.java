package com.nur.pedidos.order.infrastructure.catalog;

import com.nur.pedidos.catalog.application.GetVisibleCatalogUseCase;
import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.ProductSnapshot;
import com.nur.pedidos.order.domain.port.ProductCatalog;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ProductCatalogAdapter implements ProductCatalog {

    private final GetVisibleCatalogUseCase getVisibleCatalog;

    @Override
    public List<ProductSnapshot> productsOf(Long restaurantId) {
        return visibleCatalog(restaurantId).products().stream()
                .map(ProductCatalogAdapter::snapshotOf)
                .toList();
    }

    private Catalog visibleCatalog(Long restaurantId) {
        try {
            return getVisibleCatalog.execute(restaurantId);
        } catch (RestaurantNotFoundException hidden) {
            throw new RestaurantUnavailableException();
        }
    }

    private static ProductSnapshot snapshotOf(Product product) {
        return new ProductSnapshot(product.getId(), product.getName(), product.getPrice(), product.isAvailable());
    }
}
