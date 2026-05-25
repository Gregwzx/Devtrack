package com.devtrack.domain.repositories;

import com.devtrack.domain.entities.Streak;
import com.devtrack.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// acesso ao banco pra tabela streaks
@Repository
public interface StreakRepository extends JpaRepository<Streak, String> {

    // busca a streak pelo objeto User
    // retorna Optional porque pode não ter streak ainda (primeiro acesso)
    Optional<Streak> findByUser(User user);
}
