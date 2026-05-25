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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT") // TEXT pra suportar textos longos
    private String text;

    private String area;  // frontend | backend | fullstack | devops | security
    private String type;  // concept | bug | project | reading | tip

    // stacks guardadas como CSV — ex: "React,TypeScript,Node"
    // convertido pra List<String> no DTO na hora de retornar
    private String stacksJson;

    // N:1 — vários aprendizados pra um user
    // LAZY = só busca o user no banco se for acessar ele explicitamente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // chave estrangeira na tabela
    private User user;

    @CreationTimestamp // Hibernate preenche automaticamente
    private LocalDateTime createdAt;
}
