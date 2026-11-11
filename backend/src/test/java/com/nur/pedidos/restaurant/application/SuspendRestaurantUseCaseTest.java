package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SuspendRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final SuspendRestaurantUseCase suspendRestaurant = new SuspendRestaurantUseCase(restaurantRepository);

    @Test
    void suspendsAndClosesTheRestaurant() {
        Long id = save(7L, true, false);

        Restaurant suspended = suspendRestaurant.execute(id);

        assertThat(suspended)
                .extracting(Restaurant::getId, Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(id, true, false);
        assertThat(restaurantRepository.findById(id))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
    }

    @Test
    void leavesTheOtherRestaurantsAsTheyWere() {
        Long suspended = save(7L, true, false);
        Long other = save(8L, true, false);

        suspendRestaurant.execute(suspended);

        assertThat(restaurantRepository.findById(other))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(false, true);
    }

    @Test
    void acceptsSuspendingAnAlreadySuspendedRestaurant() {
        Long id = save(7L, false, true);

        Restaurant suspended = suspendRestaurant.execute(id);

        assertThat(suspended)
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
    }

    @Test
    void failsWhenTheRestaurantDoesNotExist() {
        save(7L, true, false);

        assertThatThrownBy(() -> suspendRestaurant.execute(99L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    private Long save(Long ownerId, boolean open, boolean suspended) {
        return restaurantRepository
                .save(new Restaurant(
                        null,
                        ownerId,
                        "La Casona",
                        null,
                        "Calle Sucre 245",
                        RestaurantCategory.TRADITIONAL,
                        null,
                        open,
                        suspended,
                        NOW))
                .getId();
    }
}
