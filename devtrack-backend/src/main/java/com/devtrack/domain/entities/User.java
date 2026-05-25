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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // UUID gerado automaticamente, sem auto_increment
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false) // constraint UNIQUE no banco
    private String email;

    @Column(nullable = false)
    private String passwordHash; // hash BCrypt — nunca salvamos senha em texto puro

    private String photoUrl;
    private String bio;
    private String bannerColor;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'fullstack'")
    private String studyArea; // frontend | backend | fullstack

    @CreationTimestamp // Hibernate preenche na criação
    private LocalDateTime createdAt;

    @UpdateTimestamp // Hibernate atualiza em todo save()
    private LocalDateTime updatedAt;

    // 1:N com Learning — cascade deleta os aprendizados junto com o user
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Learning> learnings = new ArrayList<>();

    // 1:1 com Streak — cascade também
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Streak streak;
}