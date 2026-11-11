package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.identity.domain.port.AccountSessions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SuspendAccountUseCase {

    private final AccountRepository accountRepository;
    private final AccountSessions accountSessions;

    @Transactional
    public void execute(Long accountId) {
        Account account =
                accountRepository.findById(accountId).orElseThrow(() -> new AccountNotFoundException(accountId));
        account.suspend();
        accountRepository.save(account);
        accountSessions.revokeAll(accountId);
    }
}
