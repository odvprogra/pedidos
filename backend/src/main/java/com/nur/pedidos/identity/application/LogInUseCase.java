package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.identity.domain.port.PasswordHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LogInUseCase {

    private final AccountRepository accountRepository;
    private final PasswordHasher passwordHasher;

    @Transactional(readOnly = true)
    public Account execute(LogInCommand command) {
        Account account = accountRepository
                .findByEmail(Account.normalizeEmail(command.email()))
                .orElseThrow(InvalidCredentialsException::new);
        account.authenticate(command.password(), passwordHasher);
        return account;
    }
}
