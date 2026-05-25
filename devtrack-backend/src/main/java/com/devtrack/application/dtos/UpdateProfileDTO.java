package com.devtrack.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

// body do PUT /api/v1/users/me
// todos os campos são opcionais — só atualiza o que vier preenchido
@Data
@Schema(description = "Dados para atualizar o perfil do usuário")
public class UpdateProfileDTO {
    private String name;
    private String bio;
    private String photoUrl;
    private String bannerColor;
    private String studyArea;
}
