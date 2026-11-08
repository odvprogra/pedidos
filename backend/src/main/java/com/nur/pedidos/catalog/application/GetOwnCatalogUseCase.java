package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetOwnCatalogUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Catalog execute(Long ownerId) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(ownerId);
        return new Catalog(
                categoryRepository.findAllByRestaurantId(restaurantId),
                productRepository.findAllByRestaurantId(restaurantId));
    }
}
