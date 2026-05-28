package com.devtrack.application.dtos;

import com.devtrack.domain.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// dados públicos do usuário — nunca expõe a senha nem dados internos
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dados públicos do usuário")
public class UserDTO {

    private String id;
    private String name;
    private String email;
    private String photoUrl;
    private String bio;
    private String studyArea;
    private String bannerColor;
    private int streak;
    private String streakLastDate; // formato yyyy-MM-dd
    private int lives;             // 0–5 — sistema de vidas estilo Duolingo

    // método estático que converte a entidade User pra esse DTO
    // aqui inclui a streak junto, aproveitando o relacionamento carregado
    public static UserDTO from(User user) {
        int streakCount = 0;
        String streakLastDate = null;
        if (user.getStreak() != null) {
            streakCount = user.getStreak().getCount();
            LocalDate lastDate = user.getStreak().getLastDate();
            if (lastDate != null) {
                streakLastDate = lastDate.toString();
            }
        }

        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .photoUrl(user.getPhotoUrl())
                .bio(user.getBio())
                .studyArea(user.getStudyArea())
                .bannerColor(user.getBannerColor())
                .streak(streakCount)
                .streakLastDate(streakLastDate)
                .lives(user.getLives())
                .build();
    }
}
