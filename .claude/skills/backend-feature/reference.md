# Ejemplo de referencia: módulo `restaurant`

Es el código real del módulo `restaurant`, verificado con `./mvnw verify` (Spotless, ArchUnit y tests en verde). Es la forma canónica de cada pieza; al crear algo nuevo se copia la estructura y se cambian nombres y reglas. Los tests largos aparecen recortados y lo dicen.

Si el módulo cambia, este archivo se actualiza en el mismo PR. Las tablas y columnas de cada módulo están en `docs/modelo-de-datos.md`.

## Dominio: modelo

`backend/src/main/java/com/nur/pedidos/restaurant/domain/model/Restaurant.java`

```java
package com.nur.pedidos.restaurant.domain.model;

import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import lombok.Getter;

@Getter
public class Restaurant {

    private final Long id;
    private final Long ownerId;
    private final String name;
    private final String description;
    private final String address;
    private boolean open;
    private final boolean suspended;
    private final Instant createdAt;

    public Restaurant(
            Long id,
            Long ownerId,
            String name,
            String description,
            String address,
            boolean open,
            boolean suspended,
            Instant createdAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.address = address;
        this.open = open;
        this.suspended = suspended;
        this.createdAt = createdAt;
    }

    public static Restaurant register(Long ownerId, String name, String description, String address, Instant now) {
        if (name == null || name.isBlank()) {
            throw new DomainException("restaurant.name_required", "El nombre del restaurante es obligatorio");
        }
        if (address == null || address.isBlank()) {
            throw new DomainException("restaurant.address_required", "La dirección del restaurante es obligatoria");
        }
        return new Restaurant(
                null, ownerId, name.strip(), stripToNull(description), address.strip(), false, false, now);
    }

    public void open() {
        if (suspended) {
            throw new RestaurantSuspendedException();
        }
        this.open = true;
    }

    public void close() {
        this.open = false;
    }

    public boolean isVisible() {
        return !suspended;
    }

    private static String stripToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }
}
```

## Dominio: puerto

`backend/src/main/java/com/nur/pedidos/restaurant/domain/port/RestaurantRepository.java`

```java
package com.nur.pedidos.restaurant.domain.port;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;

public interface RestaurantRepository {

    Restaurant save(Restaurant restaurant);

    Optional<Restaurant> findById(Long id);

    Optional<Restaurant> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    PageResult<Restaurant> findVisibleOpenFirst(int page, int size);
}
```

## Dominio: excepción

Se crea una subclase cuando el error necesita otro estado HTTP. Esta extiende `ConflictException`, así que responde `409`.

`backend/src/main/java/com/nur/pedidos/restaurant/domain/exception/RestaurantSuspendedException.java`

```java
package com.nur.pedidos.restaurant.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class RestaurantSuspendedException extends ConflictException {

    public RestaurantSuspendedException() {
        super("restaurant.suspended", "El restaurante está suspendido y no se puede abrir");
    }
}
```

## Aplicación: command

El id del usuario que hace la petición viaja en el command. Sale de la sesión, nunca del body.

`backend/src/main/java/com/nur/pedidos/restaurant/application/RegisterRestaurantCommand.java`

```java
package com.nur.pedidos.restaurant.application;

public record RegisterRestaurantCommand(Long ownerId, String name, String description, String address) {}
```

## Aplicación: caso de uso que escribe

La hora actual sale del `Clock` de `shared.infrastructure.time`, inyectado por constructor. En los tests se pasa `Clock.fixed(...)`.

`backend/src/main/java/com/nur/pedidos/restaurant/application/RegisterRestaurantUseCase.java`

```java
package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegisterRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;
    private final Clock clock;

    @Transactional
    public Restaurant execute(RegisterRestaurantCommand command) {
        if (restaurantRepository.existsByOwnerId(command.ownerId())) {
            throw new RestaurantAlreadyRegisteredException();
        }
        Restaurant restaurant = Restaurant.register(
                command.ownerId(), command.name(), command.description(), command.address(), clock.instant());
        return restaurantRepository.save(restaurant);
    }
}
```

## Aplicación: caso de uso que cambia un estado

Busca el recurso del usuario, le pide al dominio el cambio y lo guarda. La regla (un restaurante suspendido no se abre) vive en el modelo.

`backend/src/main/java/com/nur/pedidos/restaurant/application/OpenRestaurantUseCase.java`

```java
package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OpenRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional
    public void execute(Long ownerId) {
        Restaurant restaurant =
                restaurantRepository.findByOwnerId(ownerId).orElseThrow(RestaurantNotFoundException::new);
        restaurant.open();
        restaurantRepository.save(restaurant);
    }
}
```

## Aplicación: caso de uso que lee

`backend/src/main/java/com/nur/pedidos/restaurant/application/GetOwnRestaurantUseCase.java`

```java
package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetOwnRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public Restaurant execute(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).orElseThrow(RestaurantNotFoundException::new);
    }
}
```

## Persistencia: migración

El número es el siguiente libre en esa carpeta. La entidad tiene que coincidir con la tabla: si no, `ddl-auto: validate` no deja arrancar. `owner_id` es el id de otro módulo: una columna sin clave foránea. Su `unique` ya crea un índice, así que no lleva otro aparte.

`backend/src/main/resources/db/migration/V2__create_restaurants.sql`

```sql
create table restaurants (
    id bigint generated by default as identity primary key,
    owner_id bigint not null unique,
    name varchar(120) not null,
    description varchar(300),
    address varchar(200) not null,
    open boolean not null default false,
    suspended boolean not null default false,
    created_at timestamptz not null
);
```

## Persistencia: entidad JPA

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantEntity.java`

```java
package com.nur.pedidos.restaurant.infrastructure.persistence;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class RestaurantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(nullable = false)
    private boolean open;

    @Column(nullable = false)
    private boolean suspended;

    @Column(nullable = false)
    private Instant createdAt;

    static RestaurantEntity fromDomain(Restaurant restaurant) {
        RestaurantEntity entity = new RestaurantEntity();
        entity.setId(restaurant.getId());
        entity.setOwnerId(restaurant.getOwnerId());
        entity.setName(restaurant.getName());
        entity.setDescription(restaurant.getDescription());
        entity.setAddress(restaurant.getAddress());
        entity.setOpen(restaurant.isOpen());
        entity.setSuspended(restaurant.isSuspended());
        entity.setCreatedAt(restaurant.getCreatedAt());
        return entity;
    }

    Restaurant toDomain() {
        return new Restaurant(id, ownerId, name, description, address, open, suspended, createdAt);
    }
}
```

## Persistencia: repositorio Spring Data

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantJpaRepository.java`

```java
package com.nur.pedidos.restaurant.infrastructure.persistence;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface RestaurantJpaRepository extends JpaRepository<RestaurantEntity, Long> {

    Optional<RestaurantEntity> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    Page<RestaurantEntity> findAllBySuspendedFalse(Pageable pageable);
}
```

## Persistencia: adaptador del puerto

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapter.java`

```java
package com.nur.pedidos.restaurant.infrastructure.persistence;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class RestaurantPersistenceAdapter implements RestaurantRepository {

    private static final Sort OPEN_FIRST = Sort.by(Sort.Order.desc("open"), Sort.Order.asc("id"));

    private final RestaurantJpaRepository jpaRepository;

    @Override
    public Restaurant save(Restaurant restaurant) {
        return jpaRepository.save(RestaurantEntity.fromDomain(restaurant)).toDomain();
    }

    @Override
    public Optional<Restaurant> findById(Long id) {
        return jpaRepository.findById(id).map(RestaurantEntity::toDomain);
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId).map(RestaurantEntity::toDomain);
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return jpaRepository.existsByOwnerId(ownerId);
    }

    @Override
    public PageResult<Restaurant> findVisibleOpenFirst(int page, int size) {
        Page<RestaurantEntity> entities = jpaRepository.findAllBySuspendedFalse(PageRequest.of(page, size, OPEN_FIRST));
        return new PageResult<>(
                entities.map(RestaurantEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }
}
```

## Web: request

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/web/RegisterRestaurantRequest.java`

```java
package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record RegisterRestaurantRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 300) String description,
        @NotBlank @Size(max = 200) String address) {

    RegisterRestaurantCommand toCommand(Long ownerId) {
        return new RegisterRestaurantCommand(ownerId, name, description, address);
    }
}
```

## Web: response

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/web/RestaurantResponse.java`

```java
package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.domain.model.Restaurant;

record RestaurantResponse(Long id, String name, String description, String address, boolean open, boolean suspended) {

    static RestaurantResponse from(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen(),
                restaurant.isSuspended());
    }
}
```

## Web: controller

Cada método declara quién lo puede usar con `@PreAuthorize`. El usuario llega con `@AuthenticationPrincipal CurrentUser` y su id pasa al caso de uso. Si una ruta es pública, va en un controller aparte sin `@PreAuthorize` (ver la sección siguiente).

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/web/RestaurantController.java`

```java
package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.CloseRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
class RestaurantController {

    private static final URI OWN_RESTAURANT = URI.create("/api/v1/restaurants/mine");

    private final RegisterRestaurantUseCase registerRestaurant;
    private final GetOwnRestaurantUseCase getOwnRestaurant;
    private final OpenRestaurantUseCase openRestaurant;
    private final CloseRestaurantUseCase closeRestaurant;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    ResponseEntity<RestaurantResponse> register(
            @AuthenticationPrincipal CurrentUser owner, @Valid @RequestBody RegisterRestaurantRequest request) {
        Restaurant restaurant = registerRestaurant.execute(request.toCommand(owner.id()));
        return ResponseEntity.created(OWN_RESTAURANT).body(RestaurantResponse.from(restaurant));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    RestaurantResponse mine(@AuthenticationPrincipal CurrentUser owner) {
        return RestaurantResponse.from(getOwnRestaurant.execute(owner.id()));
    }

    @PostMapping("/mine/open")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void open(@AuthenticationPrincipal CurrentUser owner) {
        openRestaurant.execute(owner.id());
    }

    @PostMapping("/mine/close")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void close(@AuthenticationPrincipal CurrentUser owner) {
        closeRestaurant.execute(owner.id());
    }
}
```

## Web: controller público

Las rutas que cualquiera puede leer van en un controller propio, sin `@PreAuthorize` ni `CurrentUser`. Una lista paginada recibe `page` y `size` con sus límites y responde con `PageResponse.from(...)`.

`backend/src/main/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantController.java`

```java
package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.application.ListVisibleRestaurantsUseCase;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
class PublicRestaurantController {

    private final ListVisibleRestaurantsUseCase listVisibleRestaurants;
    private final GetVisibleRestaurantUseCase getVisibleRestaurant;

    @GetMapping
    PageResponse<PublicRestaurantResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listVisibleRestaurants.execute(page, size), PublicRestaurantResponse::from);
    }

    @GetMapping("/{id}")
    PublicRestaurantResponse get(@PathVariable Long id) {
        return PublicRestaurantResponse.from(getVisibleRestaurant.execute(id));
    }
}
```

Las rutas públicas se declaran en `SecurityConfig` solo para `GET`. Las del dueño van antes, porque `/api/v1/restaurants/*` también coincidiría con `/mine`.

`backend/src/main/java/com/nur/pedidos/shared/infrastructure/security/SecurityConfig.java` (recortado: las rutas del restaurante)

```java
private static final String OWN_RESTAURANT = "/api/v1/restaurants/mine/**";
private static final String[] PUBLIC_RESTAURANTS = {
    "/api/v1/restaurants", "/api/v1/restaurants/*", "/api/v1/restaurants/*/catalog"
};

.requestMatchers(OWN_RESTAURANT)
.authenticated()
.requestMatchers(HttpMethod.GET, PUBLIC_RESTAURANTS)
.permitAll()
```

## Test de dominio

Recortado: se muestran algunos de sus casos.

`backend/src/test/java/com/nur/pedidos/restaurant/domain/model/RestaurantTest.java`

```java
package com.nur.pedidos.restaurant.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class RestaurantTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    @Test
    void registersAClosedRestaurantWithTrimmedFields() {
        Restaurant restaurant =
                Restaurant.register(7L, "  La Casona  ", "  Comida criolla  ", "  Calle Sucre 245 ", NOW);

        assertThat(restaurant.getId()).isNull();
        assertThat(restaurant.getOwnerId()).isEqualTo(7L);
        assertThat(restaurant.getName()).isEqualTo("La Casona");
        assertThat(restaurant.getDescription()).isEqualTo("Comida criolla");
        assertThat(restaurant.getAddress()).isEqualTo("Calle Sucre 245");
        assertThat(restaurant.isOpen()).isFalse();
        assertThat(restaurant.isSuspended()).isFalse();
        assertThat(restaurant.getCreatedAt()).isEqualTo(NOW);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankName(String name) {
        assertThatThrownBy(() -> Restaurant.register(7L, name, null, "Calle Sucre 245", NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("restaurant.name_required");
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        Restaurant restaurant = restaurant(false, true);

        assertThatThrownBy(restaurant::open)
                .isInstanceOf(RestaurantSuspendedException.class)
                .extracting("code")
                .isEqualTo("restaurant.suspended");
        assertThat(restaurant.isOpen()).isFalse();
    }

    private static Restaurant restaurant(boolean open, boolean suspended) {
        return new Restaurant(1L, 7L, "La Casona", null, "Calle Sucre 245", open, suspended, NOW);
    }
}
```

## Fake del puerto para tests de aplicación

Guarda y devuelve copias, así un caso de uso que olvida llamar a `save` hace fallar su test.

`backend/src/test/java/com/nur/pedidos/restaurant/application/InMemoryRestaurantRepository.java`

```java
package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

class InMemoryRestaurantRepository implements RestaurantRepository {

    private static final Comparator<Restaurant> OPEN_FIRST =
            Comparator.comparing(Restaurant::isOpen).reversed().thenComparing(Restaurant::getId);

    private final Map<Long, Restaurant> restaurants = new HashMap<>();
    private long sequence;

    @Override
    public Restaurant save(Restaurant restaurant) {
        Long id = restaurant.getId() != null ? restaurant.getId() : ++sequence;
        restaurants.put(id, copyOf(restaurant, id));
        return copyOf(restaurant, id);
    }

    @Override
    public Optional<Restaurant> findById(Long id) {
        return Optional.ofNullable(restaurants.get(id)).map(restaurant -> copyOf(restaurant, id));
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return restaurants.values().stream()
                .filter(restaurant -> restaurant.getOwnerId().equals(ownerId))
                .findFirst()
                .map(restaurant -> copyOf(restaurant, restaurant.getId()));
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return findByOwnerId(ownerId).isPresent();
    }

    @Override
    public PageResult<Restaurant> findVisibleOpenFirst(int page, int size) {
        List<Restaurant> visible = restaurants.values().stream()
                .filter(Restaurant::isVisible)
                .sorted(OPEN_FIRST)
                .toList();
        List<Restaurant> items = visible.stream()
                .skip((long) page * size)
                .limit(size)
                .map(restaurant -> copyOf(restaurant, restaurant.getId()))
                .toList();
        return new PageResult<>(items, page, size, visible.size());
    }

    int count() {
        return restaurants.size();
    }

    private static Restaurant copyOf(Restaurant restaurant, Long id) {
        return new Restaurant(
                id,
                restaurant.getOwnerId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen(),
                restaurant.isSuspended(),
                restaurant.getCreatedAt());
    }
}
```

## Test de caso de uso

La pertenencia se prueba con dos dueños: el cambio de uno no toca el restaurante del otro.

`backend/src/test/java/com/nur/pedidos/restaurant/application/OpenRestaurantUseCaseTest.java`

```java
package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class OpenRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final OpenRestaurantUseCase openRestaurant = new OpenRestaurantUseCase(restaurantRepository);

    @Test
    void opensOnlyTheRestaurantOfTheOwner() {
        restaurantRepository.save(restaurant(7L, false, false));
        restaurantRepository.save(restaurant(8L, false, false));

        openRestaurant.execute(7L);

        assertThat(isOpen(7L)).isTrue();
        assertThat(isOpen(8L)).isFalse();
    }

    @Test
    void acceptsOpeningAnOpenRestaurant() {
        restaurantRepository.save(restaurant(7L, true, false));

        openRestaurant.execute(7L);

        assertThat(isOpen(7L)).isTrue();
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        restaurantRepository.save(restaurant(7L, false, true));

        assertThatThrownBy(() -> openRestaurant.execute(7L))
                .isInstanceOf(RestaurantSuspendedException.class)
                .extracting("code")
                .isEqualTo("restaurant.suspended");
        assertThat(isOpen(7L)).isFalse();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        restaurantRepository.save(restaurant(7L, false, false));

        assertThatThrownBy(() -> openRestaurant.execute(8L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
        assertThat(isOpen(7L)).isFalse();
    }

    private static Restaurant restaurant(Long ownerId, boolean open, boolean suspended) {
        return new Restaurant(null, ownerId, "La Casona", null, "Calle Sucre 245", open, suspended, NOW);
    }

    private boolean isOpen(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).orElseThrow().isOpen();
    }
}
```

## Test del controller (slice web)

`@Import(SecurityConfig.class)` aplica las rutas públicas, los `@PreAuthorize` y las respuestas 401 y 403 reales. Cada endpoint protegido se prueba sin sesión, con el rol incorrecto (matriz con `@ParameterizedTest`) y con el correcto. `sessionOf(rol, id)` simula la sesión y `csrf()` agrega el token en las peticiones que modifican. Recortado: se muestran algunos de sus casos.

`backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/RestaurantControllerTest.java`

```java
package com.nur.pedidos.restaurant.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.restaurant.application.CloseRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(RestaurantController.class)
@Import(SecurityConfig.class)
class RestaurantControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");
    private static final String REGISTRATION = """
            {"name": "La Casona", "description": "Comida criolla", "address": "Calle Sucre 245"}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private RegisterRestaurantUseCase registerRestaurant;

    @MockitoBean
    private GetOwnRestaurantUseCase getOwnRestaurant;

    @MockitoBean
    private OpenRestaurantUseCase openRestaurant;

    @MockitoBean
    private CloseRestaurantUseCase closeRestaurant;

    @Test
    void registersARestaurantForTheOwnerInSession() {
        when(registerRestaurant.execute(any())).thenReturn(laCasona(false, false));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/restaurants/mine")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "id": 1,
                          "name": "La Casona",
                          "description": "Comida criolla",
                          "address": "Calle Sucre 245",
                          "open": false,
                          "suspended": false
                        }
                        """);
        verify(registerRestaurant)
                .execute(new RegisterRestaurantCommand(7L, "La Casona", "Comida criolla", "Calle Sucre 245"));
    }

    @Test
    void rejectsARegistrationWithoutSession() {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(registerRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "ADMIN"})
    void rejectsARegistrationFromAnotherRole(String role) {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf(role, 3L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(registerRestaurant);
    }

    @ParameterizedTest
    @MethodSource("fieldsLongerThanTheirColumn")
    void rejectsAFieldLongerThanItsColumn(String body, String field) {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        doThrow(new RestaurantSuspendedException()).when(openRestaurant).execute(7L);

        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/open")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.suspended");
    }

    @Test
    void returnsNotFoundWhenTheOwnerHasNoRestaurant() {
        when(getOwnRestaurant.execute(7L)).thenThrow(new RestaurantNotFoundException());

        assertThat(mvc.get().uri("/api/v1/restaurants/mine").with(sessionOf("OWNER", 7L)))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    static Stream<Arguments> fieldsLongerThanTheirColumn() {
        return Stream.of(
                Arguments.of(registration("a".repeat(121), null, "Calle Sucre 245"), "name"),
                Arguments.of(registration("La Casona", "a".repeat(301), "Calle Sucre 245"), "description"),
                Arguments.of(registration("La Casona", null, "a".repeat(201)), "address"));
    }

    private static String registration(String name, String description, String address) {
        return """
                {"name": %s, "description": %s, "address": %s}
                """.formatted(quoted(name), quoted(description), quoted(address));
    }

    private static String quoted(String value) {
        return value == null ? "null" : '"' + value + '"';
    }

    private static Restaurant laCasona(boolean open, boolean suspended) {
        return new Restaurant(1L, 7L, "La Casona", "Comida criolla", "Calle Sucre 245", open, suspended, NOW);
    }
}
```

## Test de persistencia (PostgreSQL real con Testcontainers)

Además de guardar y buscar, prueba la restricción que respalda una regla: el segundo restaurante del mismo dueño.

`backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java`

```java
package com.nur.pedidos.restaurant.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
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
    void findsARestaurantByItsId() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));
        Restaurant fogon = adapter.save(Restaurant.register(8L, "El Fogón", null, "Av. Banzer 120", NOW));

        assertThat(adapter.findById(fogon.getId()))
                .get()
                .extracting(Restaurant::getOwnerId, Restaurant::getName)
                .containsExactly(8L, "El Fogón");
    }

    @Test
    void findsNothingWhenTheIdDoesNotExist() {
        Restaurant saved = adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

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
    void rejectsASecondRestaurantForTheSameOwner() {
        adapter.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThatThrownBy(() -> adapter.save(Restaurant.register(7L, "El Fogón", null, "Av. Banzer 120", NOW)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private void save(Long ownerId, String name, boolean open, boolean suspended) {
        adapter.save(new Restaurant(null, ownerId, name, null, "Calle Sucre 245", open, suspended, NOW));
    }
}
```
