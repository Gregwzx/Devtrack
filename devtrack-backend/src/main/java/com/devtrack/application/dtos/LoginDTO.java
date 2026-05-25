package com.devtrack.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// body do POST /api/v1/auth/login
// @Valid no controller ativa essas validações automaticamente
@Data
@Schema(description = "Credenciais de login")
public class LoginDTO {

    @Email
    @NotBlank(message = "E-mail é obrigatório")
    @Schema(example = "joao@email.com")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Schema(example = "senha123")
    private String password;
}
