package com.devtrack.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

// body do POST /api/v1/learnings
// só o texto é obrigatório, o resto é opcional
@Data
@Schema(description = "Dados para registrar um novo aprendizado")
public class CreateLearningDTO {

    @NotBlank(message = "Texto é obrigatório")
    @Schema(example = "Aprendi sobre hooks do React hoje", description = "Descrição do aprendizado")
    private String text;

    @Schema(example = "frontend", description = "Área: frontend | backend | fullstack | devops | security")
    private String area;

    @Schema(example = "concept", description = "Tipo: concept | bug | project | reading | tip")
    private String type;

    @Schema(example = "[\"React\", \"TypeScript\"]", description = "Tecnologias relacionadas")
    private List<String> stacks; // vira stacksJson no banco (CSV)
}
