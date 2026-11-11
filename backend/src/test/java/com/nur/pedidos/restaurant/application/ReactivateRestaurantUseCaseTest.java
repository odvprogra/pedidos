package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ReactivateRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final ReactivateRestaurantUseCase reactivateRestaurant =
            new ReactivateRestaurantUseCase(restaurantRepository);

    @Test
    void reactivatesASuspendedRestaurantClosed() {
        Long id = save(7L, false, true);

        Restaurant reactivated = reactivateRestaurant.execute(id);

        assertThat(reactivated)
                .extracting(Restaurant::getId, Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(id, false, false);
        assertThat(restaurantRepository.findById(id))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(false, false);
    }

    @Test
    void acceptsReactivatingAnActiveRestaurantAndKeepsItOpen() {
        Long id = save(7L, true, false);

        Restaurant reactivated = reactivateRestaurant.execute(id);

        assertThat(reactivated)
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(false, true);
    }

    @Test
    void failsWhenTheRestaurantDoesNotExist() {
        assertThatThrownBy(() -> reactivateRestaurant.execute(99L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    private Long save(Long ownerId, boolean open, boolean suspended) {
        return restaurantRepository
                .save(new Restaurant(null, ownerId, "La Casona", null, "Calle Sucre 245", open, suspended, NOW))
                .getId();
    }
}
