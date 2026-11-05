package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.EmailTakenException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.identity.domain.port.PasswordHasher;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegisterAccountUseCase {

    private final AccountRepository accountRepository;
    private final PasswordHasher passwordHasher;
    private final Clock clock;

    @Transactional
    public Account execute(RegisterAccountCommand command) {
        Account account = Account.register(
                command.name(), command.email(), command.password(), command.role(), passwordHasher, clock.instant());
        if (accountRepository.existsByEmail(account.getEmail())) {
            throw new EmailTakenException();
        }
        return accountRepository.save(account);
    }
}
