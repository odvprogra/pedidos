package com.nur.pedidos.catalog.domain.port;

import com.nur.pedidos.catalog.domain.model.Product;
import java.util.List;
import java.util.Optional;

public interface ProductRepository {

    Product save(Product product);

    Optional<Product> findById(Long id);

    List<Product> findAllByRestaurantId(Long restaurantId);

    boolean existsByCategoryId(Long categoryId);

    void deleteById(Long id);
}
