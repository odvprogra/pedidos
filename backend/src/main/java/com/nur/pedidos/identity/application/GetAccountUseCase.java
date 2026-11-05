package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetAccountUseCase {

    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public Account execute(Long id) {
        return accountRepository.findById(id).orElseThrow(() -> new AccountNotFoundException(id));
    }
}
