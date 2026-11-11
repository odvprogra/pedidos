package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.application.ListAccountsUseCase;
import com.nur.pedidos.identity.application.ReactivateAccountUseCase;
import com.nur.pedidos.identity.application.SuspendAccountUseCase;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
class AccountController {

    private final ListAccountsUseCase listAccounts;
    private final SuspendAccountUseCase suspendAccount;
    private final ReactivateAccountUseCase reactivateAccount;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    PageResponse<AccountSummaryResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listAccounts.execute(page, size), AccountSummaryResponse::from);
    }

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
