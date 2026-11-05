package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.AccountSuspendedException;
import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class LogInUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-04T15:00:00Z");

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();
    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final LogInUseCase logIn = new LogInUseCase(accountRepository, passwordHasher);

    @Test
    void logsInWithTheEmailInAnotherCapitalization() {
        Account saved = accountRepository.save(register());

        Account account = logIn.execute(new LogInCommand("  ANA@Correo.com ", "secreta123"));

        assertThat(account.getId()).isEqualTo(saved.getId());
    }

    @Test
    void rejectsAnUnknownEmail() {
        accountRepository.save(register());

        assertThatThrownBy(() -> logIn.execute(new LogInCommand("luis@correo.com", "secreta123")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting("code")
                .isEqualTo("identity.invalid_credentials");
    }

    @Test
    void checksThePasswordEvenWhenTheEmailIsUnknown() {
        accountRepository.save(register());

        assertThatThrownBy(() -> logIn.execute(new LogInCommand("luis@correo.com", "secreta123")))
                .isInstanceOf(InvalidCredentialsException.class);
        assertThat(passwordHasher.checkedPasswords()).isOne();
    }

    @Test
    void rejectsTheWrongPassword() {
        accountRepository.save(register());

        assertThatThrownBy(() -> logIn.execute(new LogInCommand("ana@correo.com", "otra-clave")))
                .isInstanceOf(InvalidCredentialsException.class)
                .extracting("code")
                .isEqualTo("identity.invalid_credentials");
    }

    @Test
    void rejectsASuspendedAccount() {
        Account account = register();
        account.suspend();
        accountRepository.save(account);

        assertThatThrownBy(() -> logIn.execute(new LogInCommand("ana@correo.com", "secreta123")))
                .isInstanceOf(AccountSuspendedException.class)
                .extracting("code")
                .isEqualTo("identity.account_suspended");
    }

    private Account register() {
        return Account.register("Ana Rojas", "ana@correo.com", "secreta123", Role.CUSTOMER, passwordHasher, NOW);
    }
}
