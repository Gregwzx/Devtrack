package com.devtrack.domain.entities;

import jakarta.persistence.*;
import lombok.*;

// entidade de área de estudo — vira a tabela study_areas no banco
// serve como lookup para evitar strings livres em outras tabelas (3FN)
@Entity
@Table(name = "study_areas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyArea {

    @Id
    private String id; // ex: 'frontend', 'backend', 'mobile'

    @Column(nullable = false, length = 50)
    private String label; // ex: 'Frontend'

    @Column(nullable = false, length = 7)
    private String color; // ex: '#06b6d4'

    @Column(nullable = false, length = 10)
    private String icon;  // ex: '🎨'
}
