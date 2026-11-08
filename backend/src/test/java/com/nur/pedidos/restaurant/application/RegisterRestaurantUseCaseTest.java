package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RegisterRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final RegisterRestaurantUseCase registerRestaurant =
            new RegisterRestaurantUseCase(restaurantRepository, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void savesAClosedRestaurantForTheOwner() {
        Restaurant restaurant = registerRestaurant.execute(
                new RegisterRestaurantCommand(7L, "La Casona", "Comida criolla", "Calle Sucre 245"));

        assertThat(restaurant.getId()).isNotNull();
        assertThat(restaurantRepository.findByOwnerId(7L))
                .get()
                .extracting(
                        Restaurant::getId,
                        Restaurant::getName,
                        Restaurant::getDescription,
                        Restaurant::getAddress,
                        Restaurant::isOpen,
                        Restaurant::getCreatedAt)
                .containsExactly(restaurant.getId(), "La Casona", "Comida criolla", "Calle Sucre 245", false, NOW);
    }

    @Test
    void rejectsASecondRestaurantForTheSameOwner() {
        registerRestaurant.execute(new RegisterRestaurantCommand(7L, "La Casona", null, "Calle Sucre 245"));

        assertThatThrownBy(() -> registerRestaurant.execute(
                        new RegisterRestaurantCommand(7L, "El Fogón", null, "Av. Banzer 120")))
                .isInstanceOf(RestaurantAlreadyRegisteredException.class)
                .extracting("code")
                .isEqualTo("restaurant.already_registered");
        assertThat(restaurantRepository.count()).isEqualTo(1);
        assertThat(restaurantRepository.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::getName)
                .isEqualTo("La Casona");
    }

    @Test
    void letsEachOwnerRegisterTheirOwnRestaurant() {
        registerRestaurant.execute(new RegisterRestaurantCommand(7L, "La Casona", null, "Calle Sucre 245"));

        registerRestaurant.execute(new RegisterRestaurantCommand(8L, "El Fogón", null, "Av. Banzer 120"));

        assertThat(restaurantRepository.count()).isEqualTo(2);
        assertThat(restaurantRepository.findByOwnerId(8L))
                .get()
                .extracting(Restaurant::getName)
                .isEqualTo("El Fogón");
    }

    @Test
    void savesNothingWhenTheRestaurantBreaksARule() {
        assertThatThrownBy(() -> registerRestaurant.execute(new RegisterRestaurantCommand(7L, "La Casona", null, " ")))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("restaurant.address_required");

        assertThat(restaurantRepository.count()).isZero();
    }
}
