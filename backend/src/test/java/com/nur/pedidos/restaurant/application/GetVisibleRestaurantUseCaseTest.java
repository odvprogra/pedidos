package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class GetVisibleRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final GetVisibleRestaurantUseCase getVisibleRestaurant =
            new GetVisibleRestaurantUseCase(restaurantRepository);

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void returnsAnOpenOrClosedRestaurant(boolean open) {
        Restaurant saved = restaurantRepository.save(restaurant(7L, "La Casona", open, false));

        Restaurant restaurant = getVisibleRestaurant.execute(saved.getId());

        assertThat(restaurant.getName()).isEqualTo("La Casona");
        assertThat(restaurant.isOpen()).isEqualTo(open);
    }

    @Test
    void returnsTheRequestedRestaurantAmongOthers() {
        restaurantRepository.save(restaurant(7L, "La Casona", true, false));
        Restaurant fogon = restaurantRepository.save(restaurant(8L, "El Fogón", true, false));

        assertThat(getVisibleRestaurant.execute(fogon.getId()).getName()).isEqualTo("El Fogón");
    }

    @Test
    void hidesASuspendedRestaurant() {
        Restaurant suspended = restaurantRepository.save(restaurant(7L, "La Casona", false, true));

        assertThatThrownBy(() -> getVisibleRestaurant.execute(suspended.getId()))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void failsWhenTheRestaurantDoesNotExist() {
        restaurantRepository.save(restaurant(7L, "La Casona", true, false));

        assertThatThrownBy(() -> getVisibleRestaurant.execute(99L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void answersTheSameForASuspendedAndAMissingRestaurant() {
        Restaurant suspended = restaurantRepository.save(restaurant(7L, "La Casona", false, true));

        Throwable hidden = catchThrowable(() -> getVisibleRestaurant.execute(suspended.getId()));
        Throwable missing = catchThrowable(() -> getVisibleRestaurant.execute(99L));

        assertThat(hidden)
                .isInstanceOf(RestaurantNotFoundException.class)
                .hasMessage(missing.getMessage())
                .hasMessage("No encontramos el restaurante");
    }

    private static Restaurant restaurant(Long ownerId, String name, boolean open, boolean suspended) {
        return new Restaurant(null, ownerId, name, null, "Calle Sucre 245", open, suspended, NOW);
    }
}
