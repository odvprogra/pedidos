package com.nur.pedidos.order.domain.port;

import com.nur.pedidos.order.domain.model.ProductSnapshot;
import java.util.List;

public interface ProductCatalog {

    List<ProductSnapshot> productsOf(Long restaurantId);
}
