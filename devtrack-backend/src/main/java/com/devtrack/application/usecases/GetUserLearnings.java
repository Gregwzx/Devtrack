package com.devtrack.application.usecases;

import com.devtrack.application.dtos.LearningDTO;
import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.LearningRepository;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

// use case de listar aprendizados paginados
// chamado pelo GET /api/v1/learnings
@Service
@RequiredArgsConstructor
public class GetUserLearnings {

    private final LearningRepository learningRepository;
    private final UserRepository userRepository;

    public Page<LearningDTO> execute(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        // PageRequest.of(page, size) = controla paginação ex: página 0, 20 itens
        // map(LearningDTO::from) = converte cada entidade pra DTO
        return learningRepository
                .findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size))
                .map(LearningDTO::from);
    }
}
