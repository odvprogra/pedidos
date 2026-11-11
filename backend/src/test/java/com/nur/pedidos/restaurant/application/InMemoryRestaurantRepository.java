package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

class InMemoryRestaurantRepository implements RestaurantRepository {

    private static final Comparator<Restaurant> OPEN_FIRST =
            Comparator.comparing(Restaurant::isOpen).reversed().thenComparing(Restaurant::getId);

    private final Map<Long, Restaurant> restaurants = new HashMap<>();
    private long sequence;

    @Override
    public Restaurant save(Restaurant restaurant) {
        Long id = restaurant.getId() != null ? restaurant.getId() : ++sequence;
        restaurants.put(id, copyOf(restaurant, id));
        return copyOf(restaurant, id);
    }

    @Override
    public Optional<Restaurant> findById(Long id) {
        return Optional.ofNullable(restaurants.get(id)).map(restaurant -> copyOf(restaurant, id));
    }

    @Override
    public Optional<Restaurant> findByIdForUpdate(Long id) {
        return findById(id);
    }

    @Override
    public Optional<Restaurant> findByOwnerIdForUpdate(Long ownerId) {
        return findByOwnerId(ownerId);
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return restaurants.values().stream()
                .filter(restaurant -> restaurant.getOwnerId().equals(ownerId))
                .findFirst()
                .map(restaurant -> copyOf(restaurant, restaurant.getId()));
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return findByOwnerId(ownerId).isPresent();
    }

    @Override
    public PageResult<Restaurant> findVisibleOpenFirst(int page, int size) {
        return pageOf(
                restaurants.values().stream()
                        .filter(Restaurant::isVisible)
                        .sorted(OPEN_FIRST)
                        .toList(),
                page,
                size);
    }

    @Override
    public PageResult<Restaurant> findPageInRegistrationOrder(int page, int size) {
        return pageOf(
                restaurants.values().stream()
                        .sorted(Comparator.comparing(Restaurant::getId))
                        .toList(),
                page,
                size);
    }

    int count() {
        return restaurants.size();
    }

    private static PageResult<Restaurant> pageOf(List<Restaurant> matching, int page, int size) {
        List<Restaurant> items = matching.stream()
                .skip((long) page * size)
                .limit(size)
                .map(restaurant -> copyOf(restaurant, restaurant.getId()))
                .toList();
        return new PageResult<>(items, page, size, matching.size());
    }

    private static Restaurant copyOf(Restaurant restaurant, Long id) {
        return new Restaurant(
                id,
                restaurant.getOwnerId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen(),
                restaurant.isSuspended(),
                restaurant.getCreatedAt());
    }
}
