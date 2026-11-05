package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.application.GetAccountUseCase;
import com.nur.pedidos.identity.application.LogInUseCase;
import com.nur.pedidos.identity.application.RegisterAccountUseCase;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import com.nur.pedidos.shared.infrastructure.security.SecuritySessions;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
class AuthController {

    private final RegisterAccountUseCase registerAccount;
    private final LogInUseCase logIn;
    private final GetAccountUseCase getAccount;
    private final SecuritySessions securitySessions;

    @PostMapping("/register")
    ResponseEntity<AccountResponse> register(
            @Valid @RequestBody RegisterAccountRequest body, HttpServletRequest request, HttpServletResponse response) {
        Account account = registerAccount.execute(body.toCommand());
        securitySessions.signIn(currentUserOf(account), request, response);
        return ResponseEntity.created(URI.create("/api/v1/auth/me")).body(AccountResponse.from(account));
    }

    @PostMapping("/login")
    AccountResponse logIn(
            @Valid @RequestBody LogInRequest body, HttpServletRequest request, HttpServletResponse response) {
        Account account = logIn.execute(body.toCommand());
        securitySessions.signIn(currentUserOf(account), request, response);
        return AccountResponse.from(account);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logOut(HttpServletRequest request, HttpServletResponse response) {
        securitySessions.signOut(request, response);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    AccountResponse me(@AuthenticationPrincipal CurrentUser user) {
        return AccountResponse.from(getAccount.execute(user.id()));
    }

    private static CurrentUser currentUserOf(Account account) {
        return new CurrentUser(account.getId(), account.getRole().name());
    }
}
