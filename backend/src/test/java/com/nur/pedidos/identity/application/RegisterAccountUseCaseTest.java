package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.EmailTakenException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RegisterAccountUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-04T15:00:00Z");

    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final RegisterAccountUseCase registerAccount =
            new RegisterAccountUseCase(accountRepository, new FakePasswordHasher(), Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void savesTheNewAccount() {
        Account account = registerAccount.execute(
                new RegisterAccountCommand("Ana Rojas", "Ana@Correo.com", "secreta123", Role.CUSTOMER));

        assertThat(account.getId()).isNotNull();
        assertThat(accountRepository.findById(account.getId()))
                .get()
                .extracting(Account::getEmail, Account::getPasswordHash, Account::getCreatedAt)
                .containsExactly("ana@correo.com", "hashed:secreta123", NOW);
    }

    @Test
    void rejectsAnEmailAlreadyTakenInAnotherCapitalization() {
        registerAccount.execute(new RegisterAccountCommand("Ana Rojas", "ana@correo.com", "secreta123", Role.CUSTOMER));

        assertThatThrownBy(() -> registerAccount.execute(
                        new RegisterAccountCommand("Ana R.", "  ANA@Correo.com ", "otra-clave", Role.OWNER)))
                .isInstanceOf(EmailTakenException.class)
                .extracting("code")
                .isEqualTo("identity.email_taken");
        assertThat(accountRepository.count()).isEqualTo(1);
    }

    @Test
    void savesNothingWhenTheAccountBreaksARule() {
        assertThatThrownBy(() -> registerAccount.execute(
                        new RegisterAccountCommand("Ana Rojas", "ana@correo.com", "corta", Role.CUSTOMER)))
                .isInstanceOf(DomainException.class);

        assertThat(accountRepository.count()).isZero();
    }

    @Test
    void keepsThePasswordOutOfTheCommandText() {
        RegisterAccountCommand command =
                new RegisterAccountCommand("Ana Rojas", "ana@correo.com", "secreta123", Role.CUSTOMER);

        assertThat(command.toString()).contains("ana@correo.com").doesNotContain("secreta123");
    }
}
