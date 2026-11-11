package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class EditRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");
    private static final String LOGO = "https://fotos.pedidos.test/fogon.png";

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final EditRestaurantUseCase editRestaurant = new EditRestaurantUseCase(restaurantRepository);

    @Test
    void changesTheDetailsOfTheRestaurantOfTheOwner() {
        restaurantRepository.save(laCasona(7L, true));

        Restaurant edited = editRestaurant.execute(new EditRestaurantCommand(
                7L, " El Fogón ", "Parrilla al carbón", " Av. Banzer 120 ", RestaurantCategory.GRILL, LOGO));

        assertThat(edited)
                .extracting(
                        Restaurant::getName,
                        Restaurant::getDescription,
                        Restaurant::getAddress,
                        Restaurant::getCategory,
                        Restaurant::getImageUrl)
                .containsExactly("El Fogón", "Parrilla al carbón", "Av. Banzer 120", RestaurantCategory.GRILL, LOGO);
        assertThat(restaurantRepository.findByOwnerId(7L).orElseThrow().getCategory())
                .isEqualTo(RestaurantCategory.GRILL);
    }

    @Test
    void keepsTheRestaurantOpenAndItsOwnerWhenTheDetailsChange() {
        restaurantRepository.save(laCasona(7L, true));

        editRestaurant.execute(new EditRestaurantCommand(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null));

        Restaurant stored = restaurantRepository.findByOwnerId(7L).orElseThrow();
        assertThat(stored)
                .extracting(
                        Restaurant::isOpen, Restaurant::isSuspended, Restaurant::getOwnerId, Restaurant::getCreatedAt)
                .containsExactly(true, false, 7L, NOW);
        assertThat(stored.getDescription()).isNull();
    }

    @Test
    void changesOnlyTheRestaurantOfTheOwner() {
        restaurantRepository.save(laCasona(7L, false));
        restaurantRepository.save(laCasona(8L, false));

        editRestaurant.execute(
                new EditRestaurantCommand(7L, "El Fogón", null, "Av. Banzer 120", RestaurantCategory.GRILL, null));

        assertThat(restaurantRepository.findByOwnerId(8L).orElseThrow().getName())
                .isEqualTo("La Casona");
    }

    @Test
    void leavesTheRestaurantAsItWasWhenTheImageIsNotAWebAddress() {
        restaurantRepository.save(laCasona(7L, false));

        assertThatThrownBy(() -> editRestaurant.execute(new EditRestaurantCommand(
                        7L, "El Fogón", null, "Av. Banzer 120", RestaurantCategory.GRILL, "logo.png")))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("restaurant.invalid_image_url");
        assertThat(restaurantRepository.findByOwnerId(7L).orElseThrow())
                .extracting(Restaurant::getName, Restaurant::getCategory)
                .containsExactly("La Casona", RestaurantCategory.TRADITIONAL);
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        assertThatThrownBy(() -> editRestaurant.execute(new EditRestaurantCommand(
                        7L, "El Fogón", null, "Av. Banzer 120", RestaurantCategory.GRILL, null)))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    private static Restaurant laCasona(Long ownerId, boolean open) {
        return new Restaurant(
                null,
                ownerId,
                "La Casona",
                "Comida criolla",
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                open,
                false,
                NOW);
    }
}
