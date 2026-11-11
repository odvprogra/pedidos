package com.nur.pedidos.order.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.model.PageResult;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, OrderPersistenceAdapter.class})
class OrderPersistenceAdapterTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");
    private static final Instant LATER = Instant.parse("2026-11-08T15:20:00Z");

    @Autowired
    private OrderPersistenceAdapter adapter;

    @Autowired
    private OrderJpaRepository jpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void savesAnOrderTogetherWithItsItems() {
        Order saved =
                adapter.save(order("56.00", item(12L, "Limonada", "10.50", 1), item(10L, "Silpancho", "45.50", 1)));

        assertThat(reload(saved))
                .extracting(
                        Order::getId,
                        Order::getCustomerId,
                        Order::getRestaurantId,
                        Order::getRestaurantName,
                        Order::getStatus,
                        Order::getTotal,
                        Order::getPlacedAt,
                        Order::getUpdatedAt)
                .containsExactly(
                        saved.getId(), 7L, 4L, "La Casona", OrderStatus.PLACED, new BigDecimal("56.00"), NOW, NOW);
    }

    @Test
    void keepsTheItemsInTheOrderTheyWereSaved() {
        Order saved =
                adapter.save(order("135.00", item(12L, "Limonada", "15.00", 3), item(10L, "Silpancho", "45.00", 2)));

        assertThat(saved.getItems()).extracting(OrderItem::id).doesNotContainNull();
        assertThat(reload(saved).getItems())
                .extracting(OrderItem::productId, OrderItem::productName, OrderItem::unitPrice, OrderItem::quantity)
                .containsExactly(
                        tuple(12L, "Limonada", new BigDecimal("15.00"), 3),
                        tuple(10L, "Silpancho", new BigDecimal("45.00"), 2));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 100})
    void rejectsAQuantityOutsideOneToNinetyNine(int quantity) {
        Order order = order("45.00", item(10L, "Silpancho", "45.00", quantity));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsTheSameProductTwiceInAnOrder() {
        Order order = order("90.00", item(10L, "Silpancho", "45.00", 1), item(10L, "Silpancho", "45.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsAnItemWithoutPrice() {
        Order order = order("45.00", item(10L, "Silpancho", "0.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsAnOrderWithoutTotal() {
        Order order = order("0.00", item(10L, "Silpancho", "45.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findsAnOrderByItsIdWithItsItems() {
        Order saved =
                adapter.save(order("56.00", item(12L, "Limonada", "10.50", 1), item(10L, "Silpancho", "45.50", 1)));
        flushAndClear();

        assertThat(adapter.findById(saved.getId())).hasValueSatisfying(order -> {
            assertThat(order.getRestaurantName()).isEqualTo("La Casona");
            assertThat(order.getItems()).extracting(OrderItem::productName).containsExactly("Limonada", "Silpancho");
        });
    }

    @Test
    void findsAnOrderToChangeItsStatus() {
        Order saved = adapter.save(order("45.00", item(10L, "Silpancho", "45.00", 1)));
        flushAndClear();

        assertThat(adapter.findByIdForUpdate(saved.getId()))
                .hasValueSatisfying(order -> assertThat(order.getId()).isEqualTo(saved.getId()));
    }

    @Test
    void findsNothingForAnUnknownId() {
        assertThat(adapter.findById(999_999L)).isEmpty();
        assertThat(adapter.findByIdForUpdate(999_999L)).isEmpty();
    }

    @Test
    void savesTheNewStatusAndKeepsTheSameItems() {
        Order saved =
                adapter.save(order("135.00", item(12L, "Limonada", "15.00", 3), item(10L, "Silpancho", "45.00", 2)));
        flushAndClear();
        Order order = adapter.findByIdForUpdate(saved.getId()).orElseThrow();

        order.accept(LATER);
        adapter.save(order);

        Order reloaded = reload(saved);
        assertThat(reloaded)
                .extracting(Order::getStatus, Order::getPlacedAt, Order::getUpdatedAt, Order::getTotal)
                .containsExactly(OrderStatus.ACCEPTED, NOW, LATER, new BigDecimal("135.00"));
        assertThat(reloaded.getItems())
                .extracting(OrderItem::id)
                .containsExactlyElementsOf(
                        saved.getItems().stream().map(OrderItem::id).toList());
    }

    @Test
    void listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst() {
        Order monday = adapter.save(placedBy(7L, "2026-11-02T12:00:00Z"));
        adapter.save(placedBy(8L, "2026-11-08T12:00:00Z"));
        Order friday = adapter.save(placedBy(7L, "2026-11-06T12:00:00Z"));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfCustomer(7L, 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(friday.getId(), monday.getId());
        assertThat(page.totalItems()).isEqualTo(2);
    }

    @Test
    void breaksTiesInTheTimeWithTheNewestNumberFirst() {
        Order first = adapter.save(placedBy(7L, "2026-11-08T12:00:00Z"));
        Order second = adapter.save(placedBy(7L, "2026-11-08T12:00:00Z"));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfCustomer(7L, 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(second.getId(), first.getId());
    }

    @Test
    void returnsTheRequestedPageWithTheRealTotals() {
        for (int day = 1; day <= 5; day++) {
            adapter.save(placedBy(7L, "2026-11-0" + day + "T12:00:00Z"));
        }
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfCustomer(7L, 1, 2);

        assertThat(page.items())
                .extracting(Order::getPlacedAt)
                .containsExactly(Instant.parse("2026-11-03T12:00:00Z"), Instant.parse("2026-11-02T12:00:00Z"));
        assertThat(page)
                .extracting(PageResult::page, PageResult::size, PageResult::totalItems, PageResult::totalPages)
                .containsExactly(1, 2, 5L, 3);
    }

    @Test
    void returnsAnEmptyPageAfterTheLastOne() {
        adapter.save(placedBy(7L, "2026-11-08T12:00:00Z"));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfCustomer(7L, 3, 20);

        assertThat(page.items()).isEmpty();
        assertThat(page.totalItems()).isEqualTo(1);
    }

    @Test
    void givesEachOrderOfThePageItsOwnItems() {
        adapter.save(new Order(
                null,
                7L,
                4L,
                "La Casona",
                OrderStatus.PLACED,
                new BigDecimal("45.00"),
                NOW,
                NOW,
                List.of(item(10L, "Silpancho", "45.00", 1))));
        adapter.save(new Order(
                null,
                7L,
                5L,
                "El Fogón",
                OrderStatus.PLACED,
                new BigDecimal("21.00"),
                LATER,
                LATER,
                List.of(item(20L, "Limonada", "10.50", 2))));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfCustomer(7L, 0, 20);

        assertThat(page.items())
                .extracting(order ->
                        order.getItems().stream().map(OrderItem::productName).toList())
                .containsExactly(List.of("Limonada"), List.of("Silpancho"));
    }

    @Test
    void listsOnlyTheOrdersOfTheRestaurantWithTheNewestFirst() {
        Order older = adapter.save(at(4L, OrderStatus.PICKED_UP, "2026-11-07T12:00:00Z"));
        adapter.save(at(5L, OrderStatus.PLACED, "2026-11-08T13:00:00Z"));
        Order newer = adapter.save(at(4L, OrderStatus.PLACED, "2026-11-08T12:00:00Z"));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfRestaurant(4L, Set.of(), 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(newer.getId(), older.getId());
        assertThat(page.totalItems()).isEqualTo(2);
    }

    @Test
    void keepsOnlyTheRequestedStatusesWithTheirRealTotals() {
        Order placed = adapter.save(at(4L, OrderStatus.PLACED, "2026-11-08T12:00:00Z"));
        Order accepted = adapter.save(at(4L, OrderStatus.ACCEPTED, "2026-11-08T11:00:00Z"));
        Order inPreparation = adapter.save(at(4L, OrderStatus.IN_PREPARATION, "2026-11-08T10:30:00Z"));
        Order ready = adapter.save(at(4L, OrderStatus.READY, "2026-11-08T10:00:00Z"));
        adapter.save(at(4L, OrderStatus.PICKED_UP, "2026-11-08T09:00:00Z"));
        adapter.save(at(4L, OrderStatus.CANCELLED, "2026-11-08T08:00:00Z"));
        adapter.save(at(5L, OrderStatus.PLACED, "2026-11-08T13:00:00Z"));
        flushAndClear();
        Set<OrderStatus> inProgress =
                Set.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.IN_PREPARATION, OrderStatus.READY);

        PageResult<Order> first = adapter.findPageOfRestaurant(4L, inProgress, 0, 2);
        PageResult<Order> second = adapter.findPageOfRestaurant(4L, inProgress, 1, 2);

        assertThat(first.items()).extracting(Order::getId).containsExactly(placed.getId(), accepted.getId());
        assertThat(second.items()).extracting(Order::getId).containsExactly(inPreparation.getId(), ready.getId());
        assertThat(first)
                .extracting(PageResult::totalItems, PageResult::totalPages)
                .containsExactly(4L, 2);
    }

    @Test
    void returnsAnEmptyPageWhenNoOrderHasTheRequestedStatus() {
        adapter.save(at(4L, OrderStatus.PICKED_UP, "2026-11-08T12:00:00Z"));
        flushAndClear();

        PageResult<Order> page = adapter.findPageOfRestaurant(4L, Set.of(OrderStatus.PLACED), 0, 20);

        assertThat(page.items()).isEmpty();
        assertThat(page.totalItems()).isZero();
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private Order reload(Order saved) {
        flushAndClear();
        return jpaRepository.findById(saved.getId()).orElseThrow().toDomain();
    }

    private static Order order(String total, OrderItem... items) {
        return new Order(
                null, 7L, 4L, "La Casona", OrderStatus.PLACED, new BigDecimal(total), NOW, NOW, List.of(items));
    }

    private static Order at(Long restaurantId, OrderStatus status, String placedAt) {
        Instant at = Instant.parse(placedAt);
        return new Order(
                null,
                7L,
                restaurantId,
                "La Casona",
                status,
                new BigDecimal("45.00"),
                at,
                at,
                List.of(item(10L, "Silpancho", "45.00", 1)));
    }

    private static Order placedBy(Long customerId, String placedAt) {
        Instant at = Instant.parse(placedAt);
        return new Order(
                null,
                customerId,
                4L,
                "La Casona",
                OrderStatus.PLACED,
                new BigDecimal("45.00"),
                at,
                at,
                List.of(item(10L, "Silpancho", "45.00", 1)));
    }

    private static OrderItem item(Long productId, String name, String unitPrice, int quantity) {
        return new OrderItem(null, productId, name, new BigDecimal(unitPrice), quantity);
    }
}
