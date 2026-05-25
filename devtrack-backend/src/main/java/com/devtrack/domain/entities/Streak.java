package com.devtrack.domain.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

// entidade de streak — controla a sequência diária do usuário
// tabela streaks no banco
@Entity
@Table(name = "streaks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Streak {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Builder.Default
    private int count = 0; // dias consecutivos de registro

    private LocalDate lastDate; // última data que o usuário registrou algo

    // 1:1 com User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
