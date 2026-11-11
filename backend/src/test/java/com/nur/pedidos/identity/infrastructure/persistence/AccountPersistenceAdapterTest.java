package com.nur.pedidos.identity.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
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
    void tellsWhetherSomeAccountHasARole() {
        adapter.save(register("ana@correo.com"));

        assertThat(adapter.existsByRole(Role.CUSTOMER)).isTrue();
        assertThat(adapter.existsByRole(Role.ADMIN)).isFalse();
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
    void listsAPageOfAccountsInRegistrationOrder() {
        adapter.save(register("ana@correo.com"));
        Account luis = register("luis@correo.com");
        luis.suspend();
        adapter.save(luis);
        adapter.save(register("carla@correo.com"));

        PageResult<Account> firstPage = adapter.findPageInRegistrationOrder(0, 2);
        PageResult<Account> secondPage = adapter.findPageInRegistrationOrder(1, 2);

        assertThat(firstPage.items())
                .extracting(Account::getEmail, Account::isSuspended)
                .containsExactly(tuple("ana@correo.com", false), tuple("luis@correo.com", true));
        assertThat(secondPage.items()).extracting(Account::getEmail).containsExactly("carla@correo.com");
        assertThat(firstPage.totalItems()).isEqualTo(3);
        assertThat(firstPage.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageAfterTheLastOneWithTheRealTotals() {
        adapter.save(register("ana@correo.com"));
        adapter.save(register("luis@correo.com"));
        adapter.save(register("carla@correo.com"));

        PageResult<Account> result = adapter.findPageInRegistrationOrder(5, 2);

        assertThat(result.items()).isEmpty();
        assertThat(result.page()).isEqualTo(5);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
    }

    @Test
    void returnsAnEmptyPageWhenThereAreNoAccounts() {
        PageResult<Account> result = adapter.findPageInRegistrationOrder(0, 20);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isZero();
        assertThat(result.totalPages()).isZero();
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
