package com.devtrack.application.dtos;

import com.devtrack.domain.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO público para o ranking global — sem expor dados sensíveis
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Entrada do ranking global")
public class RankingUserDTO {

    private Long id;
    private String name;
    private String studyArea;
    private int streak;
    private int learningCount; // total de aprendizados do usuário
    private int xp;            // XP = learningCount * 10 (calculado aqui)

    // Converte User para RankingUserDTO — exclui email e dados privados
    public static RankingUserDTO from(User user) {
        int learnings = user.getLearnings() != null ? user.getLearnings().size() : 0;
        int streakCount = user.getStreak() != null ? user.getStreak().getCount() : 0;

        return RankingUserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .studyArea(user.getStudyArea() != null ? user.getStudyArea() : "fullstack")
                .streak(streakCount)
                .learningCount(learnings)
                .xp(learnings * 10) // fórmula simples: 10 XP por aprendizado
                .build();
    }
}
