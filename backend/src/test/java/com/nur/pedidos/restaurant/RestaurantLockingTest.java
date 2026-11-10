package com.nur.pedidos.restaurant;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.SuspendRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class RestaurantLockingTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OpenRestaurantUseCase openRestaurant;

    @Autowired
    private SuspendRestaurantUseCase suspendRestaurant;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Test
    void anOpeningWaitsForTheSuspensionInProgressAndIsThenRefused() throws Exception {
        Long owner = 9_101L;
        Long restaurantId = closedRestaurantOf(owner);
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> suspension = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                Restaurant restaurant =
                        restaurantRepository.findByIdForUpdate(restaurantId).orElseThrow();
                locked.countDown();
                awaitQuietly(release);
                restaurant.suspend();
                restaurantRepository.save(restaurant);
            }));
            assertThat(locked.await(5, SECONDS)).isTrue();
            Future<?> opening = executor.submit(() -> openRestaurant.execute(owner));

            assertThatThrownBy(() -> opening.get(500, MILLISECONDS)).isInstanceOf(TimeoutException.class);
            release.countDown();
            suspension.get(5, SECONDS);

            assertThatThrownBy(() -> opening.get(5, SECONDS)).hasCauseInstanceOf(RestaurantSuspendedException.class);
            assertThat(restaurantRepository.findById(restaurantId))
                    .get()
                    .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                    .containsExactly(true, false);
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void aSuspensionWaitsForTheOpeningInProgressAndLeavesTheRestaurantSuspendedAndClosed() throws Exception {
        Long owner = 9_102L;
        Long restaurantId = closedRestaurantOf(owner);
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> opening = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                Restaurant restaurant =
                        restaurantRepository.findByOwnerIdForUpdate(owner).orElseThrow();
                locked.countDown();
                awaitQuietly(release);
                restaurant.open();
                restaurantRepository.save(restaurant);
            }));
            assertThat(locked.await(5, SECONDS)).isTrue();
            Future<Restaurant> suspension = executor.submit(() -> suspendRestaurant.execute(restaurantId));

            assertThatThrownBy(() -> suspension.get(500, MILLISECONDS)).isInstanceOf(TimeoutException.class);
            release.countDown();
            opening.get(5, SECONDS);

            assertThat(suspension.get(5, SECONDS))
                    .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                    .containsExactly(true, false);
            assertThat(restaurantRepository.findById(restaurantId))
                    .get()
                    .extracting(Restaurant::isSuspended, Restaurant::isOpen)
                    .containsExactly(true, false);
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    private Long closedRestaurantOf(Long owner) {
        return restaurantRepository
                .save(Restaurant.register(owner, "La Casona", null, "Calle Sucre 245", NOW))
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
