package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.identity.domain.port.PasswordHasher;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LogInUseCase {

    private final AccountRepository accountRepository;
    private final PasswordHasher passwordHasher;
    private final String unknownAccountHash;

    public LogInUseCase(AccountRepository accountRepository, PasswordHasher passwordHasher) {
        this.accountRepository = accountRepository;
        this.passwordHasher = passwordHasher;
        this.unknownAccountHash = passwordHasher.hash(UUID.randomUUID().toString());
    }

    @Transactional(readOnly = true)
    public Account execute(LogInCommand command) {
        Account account = accountRepository
                .findByEmail(Account.normalizeEmail(command.email()))
                .orElseThrow(() -> invalidCredentialsAfterCheckingThePassword(command.password()));
        account.authenticate(command.password(), passwordHasher);
        return account;
    }

    private InvalidCredentialsException invalidCredentialsAfterCheckingThePassword(String password) {
        passwordHasher.matches(password, unknownAccountHash);
        return new InvalidCredentialsException();
    }
}
