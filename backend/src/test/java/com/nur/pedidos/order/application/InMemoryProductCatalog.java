package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.ProductSnapshot;
import com.nur.pedidos.order.domain.port.ProductCatalog;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class InMemoryProductCatalog implements ProductCatalog {

    private final Map<Long, List<ProductSnapshot>> menus = new HashMap<>();

    void publish(Long restaurantId, ProductSnapshot... products) {
        menus.put(restaurantId, List.of(products));
    }

    @Override
    public List<ProductSnapshot> productsOf(Long restaurantId) {
        return menus.getOrDefault(restaurantId, List.of());
    }
}
