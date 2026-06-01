package com.devtrack.domain.repositories;

import com.devtrack.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// interface de acesso ao banco pra tabela app_users
// Spring Data gera a implementação automaticamente — sem SQL manual
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository já vem com save(), findById(), delete(), findAll() etc.

    // Spring gera: SELECT * FROM app_users WHERE email = ?
    Optional<User> findByEmail(String email);

    // usado no cadastro pra checar email duplicado antes de salvar
    // gera: SELECT COUNT(*) > 0 FROM app_users WHERE email = ?
    boolean existsByEmail(String email);
}
