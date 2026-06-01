package com.devtrack.application.usecases;

import com.devtrack.domain.repositories.LearningRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// use case de deletar aprendizado
@Service
@RequiredArgsConstructor
public class DeleteLearning {

    private final LearningRepository learningRepository;

    public boolean execute(Long userId, Long learningId) {
        var learning = learningRepository.findById(learningId)
                .orElseThrow(() -> new ResourceNotFoundException("Aprendizado não encontrado: " + learningId));

        // segurança extra — verifica se quem tá deletando é o dono
        if (!learning.getUser().getId().equals(userId)) {
            return false;
        }

        learningRepository.delete(learning);
        return true;
    }
}
