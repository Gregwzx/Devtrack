package com.devtrack.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// resposta padrão de autenticação — retornada no login, cadastro e refresh
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resposta de autenticação com tokens JWT")
public class AuthResponseDTO {

    @Schema(description = "JWT de acesso (válido por 15 minutos)")
    private String accessToken;

    @Schema(description = "JWT de refresh (válido por 7 dias)")
    private String refreshToken;

    @Schema(description = "Dados básicos do usuário autenticado")
    private UserDTO user;
}
