package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.identity.domain.port.PasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateAdminUseCase {

    private final AccountRepository accountRepository;
    private final PasswordHasher passwordHasher;
    private final Clock clock;

    @Transactional
    public void execute(CreateAdminCommand command) {
        Account admin = Account.createAdmin(command.email(), command.password(), passwordHasher, clock.instant());
        accountRepository
                .findByEmail(admin.getEmail())
                .ifPresentOrElse(CreateAdminUseCase::requireAdmin, () -> accountRepository.save(admin));
    }

    private static void requireAdmin(Account existing) {
        if (existing.getRole() != Role.ADMIN) {
            throw new DomainException(
                    "identity.admin_email_taken", "El correo del administrador ya es de un cliente o un dueño");
        }
    }
}
