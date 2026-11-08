package com.nur.pedidos.restaurant.infrastructure.persistence;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class RestaurantPersistenceAdapter implements RestaurantRepository {

    private static final Sort OPEN_FIRST = Sort.by(Sort.Order.desc("open"), Sort.Order.asc("id"));

    private final RestaurantJpaRepository jpaRepository;

    @Override
    public Restaurant save(Restaurant restaurant) {
        return jpaRepository.save(RestaurantEntity.fromDomain(restaurant)).toDomain();
    }

    @Override
    public Optional<Restaurant> findById(Long id) {
        return jpaRepository.findById(id).map(RestaurantEntity::toDomain);
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId).map(RestaurantEntity::toDomain);
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return jpaRepository.existsByOwnerId(ownerId);
    }

    @Override
    public PageResult<Restaurant> findVisibleOpenFirst(int page, int size) {
        Page<RestaurantEntity> entities = jpaRepository.findAllBySuspendedFalse(PageRequest.of(page, size, OPEN_FIRST));
        return new PageResult<>(
                entities.map(RestaurantEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }
}
