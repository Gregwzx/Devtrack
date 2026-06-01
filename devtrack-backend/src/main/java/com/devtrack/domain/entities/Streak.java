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

    // BIGINT PRIMARY KEY AUTO_INCREMENT
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SMALLINT é suficiente — streak raramente passa de 1000 dias
    @Builder.Default
    @Column(nullable = false, columnDefinition = "SMALLINT DEFAULT 0")
    private int count = 0; // dias consecutivos de registro

    @Column(name = "last_date")
    private LocalDate lastDate; // última data que o usuário registrou algo

    // 1:1 com User — FK referencia o BIGINT de app_users
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}

