package com.nur.pedidos.catalog.domain.port;

import com.nur.pedidos.catalog.domain.model.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(Long id);

    Optional<Category> findByRestaurantIdAndNameIgnoringCase(Long restaurantId, String name);

    List<Category> findAllByRestaurantId(Long restaurantId);

    void deleteById(Long id);
}
