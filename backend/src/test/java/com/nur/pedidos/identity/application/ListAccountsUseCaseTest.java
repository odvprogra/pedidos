package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ListAccountsUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T12:00:00Z");

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();
    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final ListAccountsUseCase listAccounts = new ListAccountsUseCase(accountRepository);

    @Test
    void listsTheRequestedPageInRegistrationOrder() {
        save("ana@correo.com");
        save("luis@correo.com");
        save("carla@correo.com");

        PageResult<Account> result = listAccounts.execute(1, 2);

        assertThat(result.items()).extracting(Account::getEmail).containsExactly("carla@correo.com");
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
    }

    @Test
    void includesAdminsAndSuspendedAccounts() {
        accountRepository.save(Account.createAdmin("admin@pedidos.com", "secreta123", passwordHasher, NOW));
        Account suspended = register("ana@correo.com");
        suspended.suspend();
        accountRepository.save(suspended);

        PageResult<Account> result = listAccounts.execute(0, 20);

        assertThat(result.items())
                .extracting(Account::getEmail, Account::getRole, Account::isSuspended)
                .containsExactly(
                        tuple("admin@pedidos.com", Role.ADMIN, false), tuple("ana@correo.com", Role.CUSTOMER, true));
    }

    @Test
    void returnsAnEmptyPageWhenThereAreNoAccounts() {
        PageResult<Account> result = listAccounts.execute(0, 20);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalItems()).isZero();
        assertThat(result.totalPages()).isZero();
    }

    private void save(String email) {
        accountRepository.save(register(email));
    }

    private Account register(String email) {
        return Account.register("Ana Rojas", email, "secreta123", Role.CUSTOMER, passwordHasher, NOW);
    }
}
