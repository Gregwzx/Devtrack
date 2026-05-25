package com.devtrack.application.usecases;

import com.devtrack.application.dtos.CreateLearningDTO;
import com.devtrack.application.dtos.LearningDTO;
import com.devtrack.domain.entities.Learning;
import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.LearningRepository;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// use case de registrar aprendizado
// chamado pelo LearningController no POST /api/v1/learnings
@Service
@RequiredArgsConstructor
public class RegisterLearning {

    private final LearningRepository learningRepository;
    private final UserRepository userRepository;
    private final UpdateStreak updateStreak; // atualiza a streak depois de salvar

    public LearningDTO execute(String userId, CreateLearningDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        Learning learning = Learning.builder()
                .text(dto.getText())
                .area(dto.getArea())
                .type(dto.getType())
                .stacksJson(dto.getStacks() != null ? String.join(",", dto.getStacks()) : "") // lista → CSV
                .user(user)
                .build();

        Learning saved = learningRepository.save(learning); // INSERT no banco

        // toda vez que registra aprendizado, recalcula a streak automaticamente
        updateStreak.execute(user);

        return LearningDTO.from(saved); // converte pra DTO antes de retornar
    }
}