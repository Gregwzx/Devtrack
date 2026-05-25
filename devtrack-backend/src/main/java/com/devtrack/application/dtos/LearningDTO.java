package com.devtrack.application.dtos;

import com.devtrack.domain.entities.Learning;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

// DTO de aprendizado — o que retorna nos endpoints de learning
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados de um aprendizado registrado")
public class LearningDTO {

    private String id;
    private String text;
    private String area;
    private String type;
    private List<String> stacks; // convertido de CSV pra lista aqui
    private LocalDateTime createdAt;

    // converte entidade Learning pra DTO
    // transforma o stacksJson "React,TypeScript" → ["React", "TypeScript"]
    public static LearningDTO from(Learning learning) {
        List<String> stackList = (learning.getStacksJson() != null && !learning.getStacksJson().isBlank())
                ? Arrays.asList(learning.getStacksJson().split(","))
                : List.of();

        return LearningDTO.builder()
                .id(learning.getId())
                .text(learning.getText())
                .area(learning.getArea())
                .type(learning.getType())
                .stacks(stackList)
                .createdAt(learning.getCreatedAt())
                .build();
    }
}
