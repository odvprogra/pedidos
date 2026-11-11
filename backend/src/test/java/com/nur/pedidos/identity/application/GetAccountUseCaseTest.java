package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class GetAccountUseCaseTest {

    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final GetAccountUseCase getAccount = new GetAccountUseCase(accountRepository);

    @Test
    void returnsTheAccountWhenItExists() {
        Account saved = accountRepository.save(Account.register(
                "Ana Rojas",
                "ana@correo.com",
                "secreta123",
                Role.CUSTOMER,
                new FakePasswordHasher(),
                Instant.parse("2026-11-04T15:00:00Z")));

        Account found = getAccount.execute(saved.getId());

        assertThat(found.getName()).isEqualTo("Ana Rojas");
    }

    @Test
    void failsWhenTheAccountDoesNotExist() {
        assertThatThrownBy(() -> getAccount.execute(99L))
                .isInstanceOf(AccountNotFoundException.class)
                .extracting("code")
                .isEqualTo("identity.not_found");
    }
}
