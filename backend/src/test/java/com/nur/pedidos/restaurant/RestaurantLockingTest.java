package com.nur.pedidos.restaurant;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.restaurant.application.CloseRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.SuspendRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;
import java.util.function.Consumer;
import java.util.function.Supplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class RestaurantLockingTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final CountDownLatch release = new CountDownLatch(1);

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OpenRestaurantUseCase openRestaurant;

    @Autowired
    private CloseRestaurantUseCase closeRestaurant;

    @Autowired
    private SuspendRestaurantUseCase suspendRestaurant;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @AfterEach
    void stopTheThreads() {
        release.countDown();
        executor.shutdownNow();
    }

    @Test
    void anOpeningWaitsForTheSuspensionInProgressAndIsThenRefused() throws Exception {
        Long owner = 9_101L;
        Long restaurantId = save(owner, false, false);

        Future<Void> opening = startWhileHolding(
                () -> restaurantRepository.findByIdForUpdate(restaurantId), Restaurant::suspend, () -> {
                    openRestaurant.execute(owner);
                    return null;
                });

        assertThatThrownBy(() -> opening.get(5, SECONDS)).hasCauseInstanceOf(RestaurantSuspendedException.class);
        assertThat(restaurantRepository.findById(restaurantId))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
    }

    @Test
    void aClosingWaitsForTheSuspensionInProgressAndKeepsTheRestaurantSuspended() throws Exception {
        Long owner = 9_102L;
        Long restaurantId = save(owner, true, false);

        Future<Void> closing = startWhileHolding(
                () -> restaurantRepository.findByIdForUpdate(restaurantId), Restaurant::suspend, () -> {
                    closeRestaurant.execute(owner);
                    return null;
                });

        closing.get(5, SECONDS);
        assertThat(restaurantRepository.findById(restaurantId))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
    }

    @Test
    void aSuspensionWaitsForTheOpeningInProgressAndLeavesTheRestaurantSuspendedAndClosed() throws Exception {
        Long owner = 9_103L;
        Long restaurantId = save(owner, false, false);

        Future<Restaurant> suspension = startWhileHolding(
                () -> restaurantRepository.findByOwnerIdForUpdate(owner),
                Restaurant::open,
                () -> suspendRestaurant.execute(restaurantId));

        assertThat(suspension.get(5, SECONDS))
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
        assertThat(restaurantRepository.findById(restaurantId))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(true, false);
    }

    @Test
    void aClosingWaitsForTheReactivationInProgressAndKeepsTheRestaurantActive() throws Exception {
        Long owner = 9_104L;
        Long restaurantId = save(owner, false, true);

        Future<Void> closing = startWhileHolding(
                () -> restaurantRepository.findByIdForUpdate(restaurantId), Restaurant::reactivate, () -> {
                    closeRestaurant.execute(owner);
                    return null;
                });

        closing.get(5, SECONDS);
        assertThat(restaurantRepository.findById(restaurantId))
                .get()
                .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                .containsExactly(false, false);
    }

    private <T> Future<T> startWhileHolding(
            Supplier<Optional<Restaurant>> lockedRead, Consumer<Restaurant> change, Callable<T> competitor)
            throws Exception {
        CountDownLatch locked = new CountDownLatch(1);
        Future<?> holder = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
            Restaurant restaurant = lockedRead.get().orElseThrow();
            locked.countDown();
            awaitQuietly(release);
            change.accept(restaurant);
            restaurantRepository.save(restaurant);
        }));
        assertThat(locked.await(5, SECONDS)).isTrue();
        Future<T> competing = executor.submit(competitor);

        assertThatThrownBy(() -> competing.get(500, MILLISECONDS)).isInstanceOf(TimeoutException.class);
        release.countDown();
        holder.get(5, SECONDS);
        return competing;
    }

    private Long save(Long owner, boolean open, boolean suspended) {
        return restaurantRepository
                .save(new Restaurant(null, owner, "La Casona", null, "Calle Sucre 245", open, suspended, NOW))
                .getId();
    }

    private static void awaitQuietly(CountDownLatch latch) {
        try {
            latch.await(5, SECONDS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }
}
