package com.nur.pedidos.restaurant.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, RestaurantPersistenceAdapter.class})
class RestaurantPersistenceAdapterTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    @Autowired
    private RestaurantPersistenceAdapter adapter;

    @Test
    void savesAndLoadsARestaurantByItsOwner() {
        Restaurant saved = adapter.save(Restaurant.register(7L, "La Casona", "Comida criolla", "Calle Sucre 245", NOW));

        assertThat(saved.getId()).isNotNull();
        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(
                        Restaurant::getId,
                        Restaurant::getName,
                        Restaurant::getDescription,
                        Restaurant::getAddress,
                        Restaurant::isOpen,
                        Restaurant::isSuspended,
                        Restaurant::getCreatedAt)
                .containsExactly(saved.getId(), "La Casona", "Comida criolla", "Calle Sucre 245", false, false, NOW);
    }

    @Test
    void keepsARestaurantWithoutDescription() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::getDescription)
                .isNull();
    }

    @Test
    void findsNothingWhenTheOwnerHasNoRestaurant() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThat(adapter.findByOwnerId(8L)).isEmpty();
    }

    @Test
    void tellsWhetherAnOwnerAlreadyHasARestaurant() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThat(adapter.existsByOwnerId(7L)).isTrue();
        assertThat(adapter.existsByOwnerId(8L)).isFalse();
    }

    @Test
    void keepsTheOpeningOfARestaurant() {
        Restaurant restaurant = adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));
        restaurant.open();

        adapter.save(restaurant);

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::isOpen)
                .isEqualTo(true);
    }

    @Test
    void keepsTheSuspensionOfARestaurant() {
        adapter.save(new Restaurant(null, 7L, "La Casona", null, "Calle Sucre 245", false, true, NOW));

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(false, true);
    }

    @Test
    void rejectsASecondRestaurantForTheSameOwner() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThatThrownBy(() -> adapter.save(Restaurant.register(7L, "El Fogón", null, "Av. Banzer 120", NOW)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
