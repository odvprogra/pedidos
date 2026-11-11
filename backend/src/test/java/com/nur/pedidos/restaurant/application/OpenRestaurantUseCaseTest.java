package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class OpenRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final OpenRestaurantUseCase openRestaurant = new OpenRestaurantUseCase(restaurantRepository);

    @Test
    void opensOnlyTheRestaurantOfTheOwner() {
        restaurantRepository.save(restaurant(7L, false, false));
        restaurantRepository.save(restaurant(8L, false, false));

        openRestaurant.execute(7L);

        assertThat(isOpen(7L)).isTrue();
        assertThat(isOpen(8L)).isFalse();
    }

    @Test
    void acceptsOpeningAnOpenRestaurant() {
        restaurantRepository.save(restaurant(7L, true, false));

        openRestaurant.execute(7L);

        assertThat(isOpen(7L)).isTrue();
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        restaurantRepository.save(restaurant(7L, false, true));

        assertThatThrownBy(() -> openRestaurant.execute(7L))
                .isInstanceOf(RestaurantSuspendedException.class)
                .extracting("code")
                .isEqualTo("restaurant.suspended");
        assertThat(isOpen(7L)).isFalse();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        restaurantRepository.save(restaurant(7L, false, false));

        assertThatThrownBy(() -> openRestaurant.execute(8L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
        assertThat(isOpen(7L)).isFalse();
    }

    private static Restaurant restaurant(Long ownerId, boolean open, boolean suspended) {
        return new Restaurant(null, ownerId, "La Casona", null, "Calle Sucre 245", open, suspended, NOW);
    }

    private boolean isOpen(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).orElseThrow().isOpen();
    }
}
