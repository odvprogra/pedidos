package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ListAllRestaurantsUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final ListAllRestaurantsUseCase listAllRestaurants = new ListAllRestaurantsUseCase(restaurantRepository);

    @Test
    void listsEveryRestaurantInRegistrationOrderIncludingTheSuspendedOnes() {
        save(7L, "La Casona", false, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Pizzería Napoli", false, true);

        PageResult<Restaurant> result = listAllRestaurants.execute(0, 20);

        assertThat(result.items())
                .extracting(Restaurant::getName, Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(
                        tuple("La Casona", false, false),
                        tuple("El Fogón", true, false),
                        tuple("Pizzería Napoli", false, true));
        assertThat(result.totalItems()).isEqualTo(3);
    }

    @Test
    void listsTheRequestedPage() {
        save(7L, "La Casona", true, false);
        save(8L, "El Fogón", false, true);
        save(9L, "Sabor Camba", false, false);

        PageResult<Restaurant> result = listAllRestaurants.execute(1, 2);

        assertThat(result.items()).extracting(Restaurant::getName).containsExactly("Sabor Camba");
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageWhenThereAreNoRestaurants() {
        PageResult<Restaurant> result = listAllRestaurants.execute(0, 20);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isZero();
        assertThat(result.totalPages()).isZero();
    }

    private void save(Long ownerId, String name, boolean open, boolean suspended) {
        restaurantRepository.save(new Restaurant(
                null,
                ownerId,
                name,
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                open,
                suspended,
                NOW));
    }
}
