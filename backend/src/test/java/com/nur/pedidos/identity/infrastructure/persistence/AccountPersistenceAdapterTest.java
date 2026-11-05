package com.nur.pedidos.identity.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, AccountPersistenceAdapter.class})
class AccountPersistenceAdapterTest {

    private static final Instant NOW = Instant.parse("2026-11-04T15:00:00Z");

    @Autowired
    private AccountPersistenceAdapter adapter;

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();

    @Test
    void savesAndLoadsAnAccount() {
        Account saved = adapter.save(register("ana@correo.com"));

        assertThat(saved.getId()).isNotNull();
        assertThat(adapter.findById(saved.getId()))
                .get()
                .extracting(
                        Account::getName,
                        Account::getEmail,
                        Account::getPasswordHash,
                        Account::getRole,
                        Account::isSuspended,
                        Account::getCreatedAt)
                .containsExactly("Ana Rojas", "ana@correo.com", "hashed:secreta123", Role.CUSTOMER, false, NOW);
    }

    @Test
    void findsAnAccountByItsEmail() {
        Account saved = adapter.save(register("ana@correo.com"));

        assertThat(adapter.findByEmail("ana@correo.com"))
                .get()
                .extracting(Account::getId)
                .isEqualTo(saved.getId());
    }

    @Test
    void findsNothingWhenNoAccountHasTheEmail() {
        adapter.save(register("ana@correo.com"));

        assertThat(adapter.findByEmail("luis@correo.com")).isEmpty();
    }

    @Test
    void tellsWhetherAnEmailIsTaken() {
        adapter.save(register("ana@correo.com"));

        assertThat(adapter.existsByEmail("ana@correo.com")).isTrue();
        assertThat(adapter.existsByEmail("luis@correo.com")).isFalse();
    }

    @Test
    void keepsTheSuspensionOfAnAccount() {
        Account account = adapter.save(register("ana@correo.com"));
        account.suspend();

        adapter.save(account);

        assertThat(adapter.findById(account.getId()))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(true);
    }

    @Test
    void rejectsTheSameEmailInAnotherCapitalization() {
        adapter.save(register("ana@correo.com"));

        assertThatThrownBy(() -> adapter.save(register("  ANA@Correo.com ")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Account register(String email) {
        return Account.register("Ana Rojas", email, "secreta123", Role.CUSTOMER, passwordHasher, NOW);
    }
}
