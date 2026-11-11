package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ListVisibleRestaurantsUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final ListVisibleRestaurantsUseCase listVisibleRestaurants =
            new ListVisibleRestaurantsUseCase(restaurantRepository);

    @Test
    void listsTheOpenRestaurantsFirstAndLeavesOutTheSuspendedOnes() {
        save(7L, "La Casona", false, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Pizzería Napoli", false, true);
        save(10L, "Sabor Camba", true, false);

        PageResult<Restaurant> result = listVisibleRestaurants.execute(0, 20);

        assertThat(result.items())
                .extracting(Restaurant::getName, Restaurant::isOpen)
                .containsExactly(tuple("El Fogón", true), tuple("Sabor Camba", true), tuple("La Casona", false));
        assertThat(result.totalItems()).isEqualTo(3);
    }

    @Test
    void listsTheRequestedPage() {
        save(7L, "La Casona", true, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Sabor Camba", false, false);

        PageResult<Restaurant> result = listVisibleRestaurants.execute(1, 2);

        assertThat(result.items()).extracting(Restaurant::getName).containsExactly("Sabor Camba");
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageWhenEveryRestaurantIsSuspended() {
        save(7L, "La Casona", false, true);

        PageResult<Restaurant> result = listVisibleRestaurants.execute(0, 20);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isZero();
        assertThat(result.totalPages()).isZero();
    }

    private void save(Long ownerId, String name, boolean open, boolean suspended) {
        restaurantRepository.save(new Restaurant(null, ownerId, name, null, "Calle Sucre 245", open, suspended, NOW));
    }
}
