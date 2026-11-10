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
    private static final Sort REGISTRATION_ORDER = Sort.by("id");

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
    public Optional<Restaurant> findByIdForUpdate(Long id) {
        return jpaRepository.findForUpdateById(id).map(RestaurantEntity::toDomain);
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId).map(RestaurantEntity::toDomain);
    }

    @Override
    public Optional<Restaurant> findByOwnerIdForUpdate(Long ownerId) {
        return jpaRepository.findForUpdateByOwnerId(ownerId).map(RestaurantEntity::toDomain);
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return jpaRepository.existsByOwnerId(ownerId);
    }

    @Override
    public PageResult<Restaurant> findVisibleOpenFirst(int page, int size) {
        return toPageResult(jpaRepository.findAllBySuspendedFalse(PageRequest.of(page, size, OPEN_FIRST)), page, size);
    }

    @Override
    public PageResult<Restaurant> findPageInRegistrationOrder(int page, int size) {
        return toPageResult(jpaRepository.findAll(PageRequest.of(page, size, REGISTRATION_ORDER)), page, size);
    }

    private static PageResult<Restaurant> toPageResult(Page<RestaurantEntity> entities, int page, int size) {
        return new PageResult<>(
                entities.map(RestaurantEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }
}
