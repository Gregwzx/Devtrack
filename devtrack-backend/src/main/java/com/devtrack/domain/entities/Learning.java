package com.devtrack.domain.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// entidade de aprendizado — tabela learnings no banco
@Entity
@Table(name = "learnings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Learning {

    // BIGINT PRIMARY KEY AUTO_INCREMENT — chave numérica padrão
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT") // TEXT pra suportar textos longos
    private String text;

    @Column(length = 50)
    private String area;  // frontend | backend | fullstack | devops | security | mobile

    @Column(length = 50)
    private String type;  // concept | bug | project | reading | tip | review

    // stacks guardadas como CSV — ex: "React,TypeScript,Node"
    // convertido pra List<String> no DTO na hora de retornar
    @Column(name = "stacks_json", columnDefinition = "TEXT")
    private String stacksJson;

    // N:1 — vários aprendizados pra um user
    // LAZY = só busca o user no banco se for acessar ele explicitamente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // chave estrangeira na tabela
    private User user;

    @CreationTimestamp // Hibernate preenche automaticamente
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

