package com.devtrack.domain.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// entidade principal — vira a tabela app_users no banco
// Hibernate lê as annotations abaixo e cria/atualiza a tabela sozinho
@Entity
@Table(name = "app_users") // nome app_users pra não conflitar com palavra reservada do MySQL
@Data           // Lombok — gera getters, setters, equals e toString
@Builder        // permite User.builder().name("...").build()
@NoArgsConstructor
@AllArgsConstructor
public class User {

    // INT PRIMARY KEY AUTO_INCREMENT — padrão acadêmico para identificador numérico
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 150) // constraint UNIQUE no banco
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash; // hash BCrypt — nunca salvamos senha em texto puro

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(columnDefinition = "TEXT") // bio pode ser longa — TEXT suporta até 65.535 chars
    private String bio;

    @Column(name = "banner_color", length = 20)
    private String bannerColor;

    @Column(name = "study_area", length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'fullstack'")
    private String studyArea; // frontend | backend | fullstack | mobile | devops

    // sistema de vidas estilo Duolingo — padrão 5, regenera 1 a cada 30 min
    @Column(nullable = false, columnDefinition = "TINYINT UNSIGNED DEFAULT 5")
    private int lives = 5;

    // timestamp da última vez que as vidas foram recarregadas
    @Column(name = "lives_last_refill")
    private LocalDateTime livesLastRefill;

    @CreationTimestamp // Hibernate preenche na criação
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp // Hibernate atualiza em todo save()
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 1:N com Learning — cascade deleta os aprendizados junto com o user
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Learning> learnings = new ArrayList<>();

    // 1:1 com Streak — cascade também
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Streak streak;
}