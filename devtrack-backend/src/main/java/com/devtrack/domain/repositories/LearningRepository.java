package com.devtrack.domain.repositories;

import com.devtrack.domain.entities.Learning;
import com.devtrack.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// acesso ao banco pra tabela learnings
@Repository
public interface LearningRepository extends JpaRepository<Learning, Long> {

    // Spring deriva o SQL pelo nome do método:
    // WHERE user_id = ? ORDER BY created_at DESC
    // Page = resultado paginado (não traz tudo de uma vez)
    Page<Learning> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
