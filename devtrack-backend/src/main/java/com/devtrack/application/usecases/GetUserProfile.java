package com.devtrack.application.usecases;

import com.devtrack.application.dtos.UserDTO;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// retorna o perfil do usuário autenticado
// chamado pelo GET /api/v1/users/me
@Service
@RequiredArgsConstructor
public class GetUserProfile {

    private final UserRepository userRepository;

    public UserDTO execute(String userId) {
        return userRepository.findById(userId)
                .map(UserDTO::from) // converte pra DTO — sem expor a senha
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
    }
}
