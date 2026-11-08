package com.nur.pedidos.catalog.infrastructure.persistence;

import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ProductPersistenceAdapter implements ProductRepository {

    private final ProductJpaRepository jpaRepository;

    @Override
    public Product save(Product product) {
        return jpaRepository.save(ProductEntity.fromDomain(product)).toDomain();
    }

    @Override
    public Optional<Product> findById(Long id) {
        return jpaRepository.findById(id).map(ProductEntity::toDomain);
    }

    @Override
    public List<Product> findAllByRestaurantId(Long restaurantId) {
        return jpaRepository.findAllByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .map(ProductEntity::toDomain)
                .toList();
    }

    @Override
    public boolean existsByCategoryId(Long categoryId) {
        return jpaRepository.existsByCategoryId(categoryId);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }
}
