package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ReactivateAccountUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final ReactivateAccountUseCase reactivateAccount = new ReactivateAccountUseCase(accountRepository);

    @Test
    void reactivatesASuspendedAccount() {
        Account account = register();
        account.suspend();
        Long id = accountRepository.save(account).getId();

        reactivateAccount.execute(id);

        assertThat(accountRepository.findById(id))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(false);
    }

    @Test
    void acceptsReactivatingAnActiveAccount() {
        Long id = accountRepository.save(register()).getId();

        reactivateAccount.execute(id);

        assertThat(accountRepository.findById(id))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(false);
    }

    @Test
    void failsWhenTheAccountDoesNotExist() {
        assertThatThrownBy(() -> reactivateAccount.execute(99L))
                .isInstanceOf(AccountNotFoundException.class)
                .extracting("code")
                .isEqualTo("identity.not_found");
    }

    private Account register() {
        return Account.register(
                "Ana Rojas", "ana@correo.com", "secreta123", Role.CUSTOMER, new FakePasswordHasher(), NOW);
    }
}
