package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReactivateAccountUseCase {

    private final AccountRepository accountRepository;

    @Transactional
    public void execute(Long accountId) {
        Account account =
                accountRepository.findById(accountId).orElseThrow(() -> new AccountNotFoundException(accountId));
        account.reactivate();
        accountRepository.save(account);
    }
}
