package com.devtrack.application.usecases;

import com.devtrack.application.dtos.UpdateProfileDTO;
import com.devtrack.application.dtos.UserDTO;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// atualiza os campos do perfil do usuário
// chamado pelo PUT /api/v1/users/me
@Service
@RequiredArgsConstructor
public class UpdateUserProfile {

    private final UserRepository userRepository;

    public UserDTO execute(String userId, UpdateProfileDTO dto) {
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
}
