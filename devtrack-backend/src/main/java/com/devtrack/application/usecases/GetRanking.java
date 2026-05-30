package com.devtrack.application.usecases;

import com.devtrack.application.dtos.RankingUserDTO;
import com.devtrack.domain.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

// retorna o ranking global dos usuários por streak ou aprendizados
@Service
@RequiredArgsConstructor
public class GetRanking {

    private final UserRepository userRepository;

    /**
     * Busca todos os usuários e ordena pelo critério escolhido.
     *
     * @param sortBy "streak" | "xp" | "learnings"
     * @param limit  número máximo de entradas no ranking (padrão 50)
     */
    public List<RankingUserDTO> execute(String sortBy, int limit) {
        // Busca todos os usuários do banco (eager loading das learnings via @OneToMany)
        // Para produção com muitos usuários, usar uma query SQL otimizada
        List<RankingUserDTO> all = userRepository.findAll().stream()
                .map(RankingUserDTO::from)
                .collect(Collectors.toList());

        // Ordena pelo critério selecionado
        Comparator<RankingUserDTO> comparator = switch (sortBy) {
            case "learnings" -> Comparator.comparingInt(RankingUserDTO::getLearningCount).reversed();
            case "xp"        -> Comparator.comparingInt(RankingUserDTO::getXp).reversed();
            default          -> Comparator.comparingInt(RankingUserDTO::getStreak).reversed(); // "streak"
        };

        return all.stream()
                .sorted(comparator)
                .limit(limit)
                .collect(Collectors.toList());
    }
}
