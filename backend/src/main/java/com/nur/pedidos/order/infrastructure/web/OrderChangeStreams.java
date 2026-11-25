package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.domain.model.OrderChange;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

@Component
class OrderChangeStreams {

    static final Duration LIFETIME = Duration.ofMinutes(30);
    static final Duration RECONNECT_AFTER = Duration.ofSeconds(3);

    private final Map<Long, Set<SseEmitter>> byRestaurant = new ConcurrentHashMap<>();
    private final Map<Long, Set<SseEmitter>> byCustomer = new ConcurrentHashMap<>();

    SseEmitter openForRestaurant(Long restaurantId) {
        return open(byRestaurant, restaurantId);
    }

    SseEmitter openForCustomer(Long customerId) {
        return open(byCustomer, customerId);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void deliver(OrderChange change) {
        OrderChangeMessage message = OrderChangeMessage.from(change);
        Supplier<SseEventBuilder> event =
                () -> SseEmitter.event().name("order").data(message, MediaType.APPLICATION_JSON);
        sendToAll(byRestaurant.getOrDefault(change.restaurantId(), Set.of()), event);
        sendToAll(byCustomer.getOrDefault(change.customerId(), Set.of()), event);
    }

    @Scheduled(fixedRate = 25, timeUnit = TimeUnit.SECONDS)
    public void keepAlive() {
        Supplier<SseEventBuilder> heartbeat = () -> SseEmitter.event().comment("keep-alive");
        byRestaurant.values().forEach(emitters -> sendToAll(emitters, heartbeat));
        byCustomer.values().forEach(emitters -> sendToAll(emitters, heartbeat));
    }

    private SseEmitter open(Map<Long, Set<SseEmitter>> streams, Long key) {
        SseEmitter emitter = new SseEmitter(LIFETIME.toMillis());
        Set<SseEmitter> emitters = streams.computeIfAbsent(key, ignored -> ConcurrentHashMap.newKeySet());
        emitters.add(emitter);
        Runnable forget = () -> forget(streams, key, emitter);
        emitter.onCompletion(forget);
        emitter.onTimeout(emitter::complete);
        emitter.onError(error -> forget.run());
        send(
                emitters,
                emitter,
                SseEmitter.event()
                        .name("ready")
                        .reconnectTime(RECONNECT_AFTER.toMillis())
                        .data(""));
        return emitter;
    }

    private void sendToAll(Set<SseEmitter> emitters, Supplier<SseEventBuilder> event) {
        emitters.forEach(emitter -> send(emitters, emitter, event.get()));
    }

    private void send(Set<SseEmitter> emitters, SseEmitter emitter, SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException e) {
            emitters.remove(emitter);
        }
    }

    private void forget(Map<Long, Set<SseEmitter>> streams, Long key, SseEmitter emitter) {
        streams.computeIfPresent(key, (ignored, emitters) -> {
            emitters.remove(emitter);
            return emitters.isEmpty() ? null : emitters;
        });
    }
}
