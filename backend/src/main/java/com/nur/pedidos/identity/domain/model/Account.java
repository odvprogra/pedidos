package com.nur.pedidos.identity.domain.model;

import com.nur.pedidos.identity.domain.exception.AccountSuspendedException;
import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.port.PasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import lombok.Getter;

@Getter
public class Account {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_BYTES = 72;

    private final Long id;
    private final String name;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private boolean suspended;
    private final Instant createdAt;

    public Account(
            Long id, String name, String email, String passwordHash, Role role, boolean suspended, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.suspended = suspended;
        this.createdAt = createdAt;
    }

    public static Account register(
            String name, String email, String password, Role role, PasswordHasher passwordHasher, Instant now) {
        if (role == Role.ADMIN) {
            throw new DomainException("identity.role_not_allowed", "Solo se pueden registrar clientes y dueños");
        }
        return create(name, email, password, role, passwordHasher, now);
    }

    public static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    public void authenticate(String password, PasswordHasher passwordHasher) {
        if (!passwordHasher.matches(password, passwordHash)) {
            throw new InvalidCredentialsException();
        }
        if (suspended) {
            throw new AccountSuspendedException();
        }
    }

    public void suspend() {
        if (role == Role.ADMIN) {
            throw new DomainException(
                    "identity.admin_not_suspendable", "Una cuenta de administrador no se puede suspender");
        }
        this.suspended = true;
    }

    public void reactivate() {
        this.suspended = false;
    }

    private static Account create(
            String name, String email, String password, Role role, PasswordHasher passwordHasher, Instant now) {
        if (name == null || name.isBlank()) {
            throw new DomainException("identity.name_required", "El nombre es obligatorio");
        }
        if (email == null || email.isBlank()) {
            throw new DomainException("identity.email_required", "El correo es obligatorio");
        }
        requireValidPassword(password);
        return new Account(null, name.strip(), normalizeEmail(email), passwordHasher.hash(password), role, false, now);
    }

    private static void requireValidPassword(String password) {
        if (password == null || password.codePointCount(0, password.length()) < MIN_PASSWORD_LENGTH) {
            throw new DomainException("identity.password_too_short", "La contraseña debe tener al menos 8 caracteres");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new DomainException("identity.password_too_long", "La contraseña es demasiado larga");
        }
    }
}
