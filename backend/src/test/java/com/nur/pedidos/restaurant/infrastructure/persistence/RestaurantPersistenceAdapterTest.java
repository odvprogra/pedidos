package com.nur.pedidos.restaurant.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import com.nur.pedidos.shared.domain.model.PageResult;
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
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", "Comida criolla", "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

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
    void savesTheCategoryAndTheImageAndTheirChanges() {
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.PIZZA, "https://f.test/a.png", NOW));
        saved.updateDetails("La Casona", null, "Calle Sucre 245", RestaurantCategory.SUSHI, "https://f.test/b.png");

        adapter.save(saved);

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::getCategory, Restaurant::getImageUrl)
                .containsExactly(RestaurantCategory.SUSHI, "https://f.test/b.png");
    }

    @Test
    void keepsARestaurantWithoutDescription() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::getDescription)
                .isNull();
    }

    @Test
    void findsNothingWhenTheOwnerHasNoRestaurant() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByOwnerId(8L)).isEmpty();
    }

    @Test
    void tellsWhetherAnOwnerAlreadyHasARestaurant() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.existsByOwnerId(7L)).isTrue();
        assertThat(adapter.existsByOwnerId(8L)).isFalse();
    }

    @Test
    void keepsTheOpeningOfARestaurant() {
        Restaurant restaurant = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));
        restaurant.open();

        adapter.save(restaurant);

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::isOpen)
                .isEqualTo(true);
    }

    @Test
    void keepsTheSuspensionOfARestaurant() {
        adapter.save(new Restaurant(
                null,
                7L,
                "La Casona",
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                false,
                true,
                NOW));

        assertThat(adapter.findByOwnerId(7L))
                .get()
                .extracting(Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(false, true);
    }

    @Test
    void findsARestaurantByItsId() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));
        Restaurant fogon = adapter.save(
                Restaurant.register(8L, "El Fogón", null, "Av. Banzer 120", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findById(fogon.getId()))
                .get()
                .extracting(Restaurant::getOwnerId, Restaurant::getName)
                .containsExactly(8L, "El Fogón");
    }

    @Test
    void findsARestaurantToChangeByItsId() {
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByIdForUpdate(saved.getId()))
                .get()
                .extracting(Restaurant::getOwnerId, Restaurant::getName)
                .containsExactly(7L, "La Casona");
    }

    @Test
    void findsARestaurantToChangeByItsOwner() {
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByOwnerIdForUpdate(7L))
                .get()
                .extracting(Restaurant::getId)
                .isEqualTo(saved.getId());
    }

    @Test
    void findsNothingToChangeWhenTheIdDoesNotExist() {
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByIdForUpdate(saved.getId() + 100)).isEmpty();
    }

    @Test
    void findsNothingToChangeWhenTheOwnerHasNoRestaurant() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findByOwnerIdForUpdate(8L)).isEmpty();
    }

    @Test
    void findsNothingWhenTheIdDoesNotExist() {
        Restaurant saved = adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThat(adapter.findById(saved.getId() + 100)).isEmpty();
    }

    @Test
    void listsTheVisibleRestaurantsWithTheOpenOnesFirst() {
        save(7L, "La Casona", false, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Pizzería Napoli", true, true);
        save(10L, "Sabor Camba", false, false);
        save(11L, "Doña Ely", true, false);

        PageResult<Restaurant> result = adapter.findVisibleOpenFirst(0, 20);

        assertThat(result.items())
                .extracting(Restaurant::getName, Restaurant::isOpen)
                .containsExactly(
                        tuple("El Fogón", true),
                        tuple("Doña Ely", true),
                        tuple("La Casona", false),
                        tuple("Sabor Camba", false));
        assertThat(result.totalItems()).isEqualTo(4);
        assertThat(result.totalPages()).isEqualTo(1);
    }

    @Test
    void splitsTheVisibleRestaurantsInPagesWithTheirRealTotals() {
        save(7L, "La Casona", false, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Pizzería Napoli", true, true);
        save(10L, "Sabor Camba", false, false);

        PageResult<Restaurant> firstPage = adapter.findVisibleOpenFirst(0, 2);
        PageResult<Restaurant> secondPage = adapter.findVisibleOpenFirst(1, 2);

        assertThat(firstPage.items()).extracting(Restaurant::getName).containsExactly("El Fogón", "La Casona");
        assertThat(secondPage.items()).extracting(Restaurant::getName).containsExactly("Sabor Camba");
        assertThat(secondPage.totalItems()).isEqualTo(3);
        assertThat(secondPage.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageAfterTheLastOneWithTheRealTotals() {
        save(7L, "La Casona", true, false);
        save(8L, "El Fogón", false, false);

        PageResult<Restaurant> result = adapter.findVisibleOpenFirst(3, 2);

        assertThat(result.items()).isEmpty();
        assertThat(result.page()).isEqualTo(3);
        assertThat(result.totalItems()).isEqualTo(2);
        assertThat(result.totalPages()).isEqualTo(1);
    }

    @Test
    void returnsAnEmptyPageWhenNoRestaurantIsVisible() {
        save(7L, "La Casona", false, true);

        PageResult<Restaurant> result = adapter.findVisibleOpenFirst(0, 20);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isZero();
    }

    @Test
    void keepsAnOpenRestaurantClosedOnceItIsSuspended() {
        Restaurant restaurant = adapter.save(new Restaurant(
                null,
                7L,
                "La Casona",
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                true,
                false,
                NOW));
        restaurant.suspend();

        adapter.save(restaurant);

        assertThat(adapter.findById(restaurant.getId()))
                .get()
                .extracting(Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(false, true);
    }

    @Test
    void keepsTheReactivationOfASuspendedRestaurant() {
        Restaurant restaurant = adapter.save(new Restaurant(
                null,
                7L,
                "La Casona",
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                false,
                true,
                NOW));
        restaurant.reactivate();

        adapter.save(restaurant);

        assertThat(adapter.findById(restaurant.getId()))
                .get()
                .extracting(Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(false, false);
    }

    @Test
    void listsEveryRestaurantInRegistrationOrderIncludingTheSuspendedOnes() {
        save(7L, "La Casona", false, false);
        save(8L, "El Fogón", true, false);
        save(9L, "Pizzería Napoli", false, true);

        PageResult<Restaurant> result = adapter.findPageInRegistrationOrder(0, 20);

        assertThat(result.items())
                .extracting(Restaurant::getName, Restaurant::isOpen, Restaurant::isSuspended)
                .containsExactly(
                        tuple("La Casona", false, false),
                        tuple("El Fogón", true, false),
                        tuple("Pizzería Napoli", false, true));
        assertThat(result.totalItems()).isEqualTo(3);
    }

    @Test
    void splitsEveryRestaurantInPagesWithTheirRealTotals() {
        save(7L, "La Casona", true, false);
        save(8L, "El Fogón", false, true);
        save(9L, "Sabor Camba", false, false);

        PageResult<Restaurant> secondPage = adapter.findPageInRegistrationOrder(1, 2);

        assertThat(secondPage.items()).extracting(Restaurant::getName).containsExactly("Sabor Camba");
        assertThat(secondPage.totalItems()).isEqualTo(3);
        assertThat(secondPage.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageOfEveryRestaurantAfterTheLastOne() {
        save(7L, "La Casona", true, false);
        save(8L, "El Fogón", false, true);

        PageResult<Restaurant> result = adapter.findPageInRegistrationOrder(3, 2);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isEqualTo(2);
        assertThat(result.totalPages()).isEqualTo(1);
    }

    @Test
    void rejectsASecondRestaurantForTheSameOwner() {
        adapter.save(Restaurant.register(
                7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null, NOW));

        assertThatThrownBy(() -> adapter.save(Restaurant.register(
                        7L, "El Fogón", null, "Av. Banzer 120", RestaurantCategory.TRADITIONAL, null, NOW)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private void save(Long ownerId, String name, boolean open, boolean suspended) {
        adapter.save(new Restaurant(
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
