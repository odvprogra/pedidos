package com.nur.pedidos.shared.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerTest {

    private final MockMvcTester mvc = MockMvcTester.create(MockMvcBuilders.standaloneSetup(new ProbeController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build());

    @Test
    void namesTheQueryParameterThatFailed() {
        var response = mvc.post()
                .uri("/probe?size=0")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Ana Rojas"}
                        """);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("size");
        });
    }

    @Test
    void namesTheFieldOfTheBodyWhenItFailsNextToAConstrainedParameter() {
        var response = mvc.post()
                .uri("/probe?size=5")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": " "}
                        """);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("name");
        });
    }

    @RestController
    static class ProbeController {

        @PostMapping("/probe")
        void probe(@RequestParam @Min(1) int size, @Valid @RequestBody ProbeRequest request) {}
    }

    record ProbeRequest(@NotBlank String name) {}
}
