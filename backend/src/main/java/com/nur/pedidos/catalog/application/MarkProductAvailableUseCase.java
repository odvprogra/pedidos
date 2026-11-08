package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.ProductNotFoundException;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarkProductAvailableUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final ProductRepository productRepository;

    @Transactional
    public void execute(Long ownerId, Long productId) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(ownerId);
        Product product = productRepository.findById(productId).orElseThrow(ProductNotFoundException::new);
        if (!product.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        product.markAvailable();
        productRepository.save(product);
    }
}
