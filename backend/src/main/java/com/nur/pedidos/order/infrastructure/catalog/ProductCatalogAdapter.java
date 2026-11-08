package com.nur.pedidos.order.infrastructure.catalog;

import com.nur.pedidos.catalog.application.GetVisibleCatalogUseCase;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.order.domain.model.ProductSnapshot;
import com.nur.pedidos.order.domain.port.ProductCatalog;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ProductCatalogAdapter implements ProductCatalog {

    private final GetVisibleCatalogUseCase getVisibleCatalog;

    @Override
    public List<ProductSnapshot> productsOf(Long restaurantId) {
        return getVisibleCatalog.execute(restaurantId).products().stream()
                .map(ProductCatalogAdapter::snapshotOf)
                .toList();
    }

    private static ProductSnapshot snapshotOf(Product product) {
        return new ProductSnapshot(product.getId(), product.getName(), product.getPrice(), product.isAvailable());
    }
}
