package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListAccountsUseCase {

    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public PageResult<Account> execute(int page, int size) {
        return accountRepository.findPageInRegistrationOrder(page, size);
    }
}
