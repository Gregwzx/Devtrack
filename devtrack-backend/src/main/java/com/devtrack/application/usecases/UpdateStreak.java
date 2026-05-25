package com.devtrack.application.usecases;

import com.devtrack.domain.entities.Streak;
import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.StreakRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

// lógica de sequência diária (streak)
// chamado automaticamente pelo RegisterLearning toda vez que salva um aprendizado
@Service
@RequiredArgsConstructor
public class UpdateStreak {

    private final StreakRepository streakRepository;

    public void execute(User user) {
        // busca a streak do user ou cria uma nova zerada se for a primeira vez
        Streak streak = streakRepository.findByUser(user)
                .orElse(Streak.builder().user(user).count(0).build());

        LocalDate today = LocalDate.now();

        if (streak.getLastDate() == null) {
            streak.setCount(1); // primeira vez registrando
        } else if (streak.getLastDate().equals(today)) {
            return; // já registrou hoje, não incrementa
        } else if (streak.getLastDate().equals(today.minusDays(1))) {
            streak.setCount(streak.getCount() + 1); // registrou ontem, mantém sequência
        } else {
            streak.setCount(1); // perdeu a sequência, reseta
        }

        streak.setLastDate(today);
        streakRepository.save(streak);
    }
}
