package com.nur.pedidos.catalog.infrastructure.persistence;

import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class CategoryPersistenceAdapter implements CategoryRepository {

    private final CategoryJpaRepository jpaRepository;

    @Override
    public Category save(Category category) {
        return jpaRepository.save(CategoryEntity.fromDomain(category)).toDomain();
    }

    @Override
    public Optional<Category> findById(Long id) {
        return jpaRepository.findById(id).map(CategoryEntity::toDomain);
    }

    @Override
    public Optional<Category> findByRestaurantIdAndNameIgnoringCase(Long restaurantId, String name) {
        return jpaRepository
                .findByRestaurantIdAndNameIgnoringCase(restaurantId, name)
                .map(CategoryEntity::toDomain);
    }

    @Override
    public List<Category> findAllByRestaurantId(Long restaurantId) {
        return jpaRepository.findAllByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .map(CategoryEntity::toDomain)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }
}
