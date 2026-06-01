package com.devtrack.application.usecases;

import com.devtrack.application.dtos.UpdateProfileDTO;
import com.devtrack.application.dtos.UserDTO;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

// atualiza os campos do perfil do usuário
// chamado pelo PUT /api/v1/users/me
@Service
@RequiredArgsConstructor
public class UpdateUserProfile {

    private final UserRepository userRepository;

    public UserDTO execute(Long userId, UpdateProfileDTO dto) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        // só atualiza o campo se vier preenchido no body — null ignora
        if (dto.getName() != null && !dto.getName().isBlank()) user.setName(dto.getName());
        if (dto.getBio() != null)         user.setBio(dto.getBio());
        if (dto.getPhotoUrl() != null)    user.setPhotoUrl(dto.getPhotoUrl());
        if (dto.getBannerColor() != null) user.setBannerColor(dto.getBannerColor());
        if (dto.getStudyArea() != null)   user.setStudyArea(dto.getStudyArea());

        user = userRepository.save(user); // UPDATE no banco
        return UserDTO.from(user);
    }

    // gerencia as vidas do sistema de gamificação
    // "lose" → -1 vida (mínimo 0) | "restore" → +1 vida (máximo 5) | "refill" → 5 vidas
    public UserDTO updateLives(Long userId, String action) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        int current = user.getLives();
        switch (action == null ? "" : action) {
            case "lose"    -> user.setLives(Math.max(0, current - 1));
            case "restore" -> { user.setLives(Math.min(5, current + 1)); user.setLivesLastRefill(LocalDateTime.now()); }
            case "refill"  -> { user.setLives(5); user.setLivesLastRefill(LocalDateTime.now()); }
            default        -> throw new IllegalArgumentException("Ação inválida: " + action);
        }

        user = userRepository.save(user);
        return UserDTO.from(user);
    }
}
