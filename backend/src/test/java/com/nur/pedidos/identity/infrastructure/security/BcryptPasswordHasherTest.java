package com.nur.pedidos.identity.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BcryptPasswordHasherTest {

    private final BcryptPasswordHasher passwordHasher = new BcryptPasswordHasher();

    @Test
    void hashesWithTheBcryptPrefixAndFitsTheColumn() {
        String hash = passwordHasher.hash("secreta123");

        assertThat(hash).startsWith("{bcrypt}").doesNotContain("secreta123").hasSizeLessThanOrEqualTo(100);
    }

    @Test
    void saltsEveryHash() {
        assertThat(passwordHasher.hash("secreta123")).isNotEqualTo(passwordHasher.hash("secreta123"));
    }

    @Test
    void matchesTheRightPassword() {
        String hash = passwordHasher.hash("secreta123");

        assertThat(passwordHasher.matches("secreta123", hash)).isTrue();
    }

    @Test
    void rejectsTheWrongPassword() {
        String hash = passwordHasher.hash("secreta123");

        assertThat(passwordHasher.matches("secreta124", hash)).isFalse();
    }

    @Test
    void rejectsAPasswordThatOnlySharesTheFirst72Bytes() {
        String longestPassword = "a".repeat(72);
        String hash = passwordHasher.hash(longestPassword);

        assertThat(passwordHasher.matches(longestPassword + "b", hash)).isFalse();
    }
}
