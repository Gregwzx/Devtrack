package com.devtrack.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// body do POST /api/v1/auth/register
// validado automaticamente pelo @Valid no controller
@Data
@Schema(description = "Dados para cadastro de novo usuário")
public class RegisterDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Schema(example = "João Silva")
    private String name;

    @Email(message = "E-mail inválido")
    @NotBlank(message = "E-mail é obrigatório")
    @Schema(example = "joao@email.com")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    @Schema(example = "senha123")
    private String password;
}
