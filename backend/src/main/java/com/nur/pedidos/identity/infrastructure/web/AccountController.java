package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.application.ReactivateAccountUseCase;
import com.nur.pedidos.identity.application.SuspendAccountUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
class AccountController {

    private final SuspendAccountUseCase suspendAccount;
    private final ReactivateAccountUseCase reactivateAccount;

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void suspend(@PathVariable Long id) {
        suspendAccount.execute(id);
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reactivate(@PathVariable Long id) {
        reactivateAccount.execute(id);
    }
}
