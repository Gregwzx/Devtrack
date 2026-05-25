package com.devtrack.web.controllers;

import com.devtrack.application.dtos.UpdateProfileDTO;
import com.devtrack.application.dtos.UserDTO;
import com.devtrack.application.usecases.GetUserProfile;
import com.devtrack.application.usecases.UpdateUserProfile;
import com.devtrack.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// controller de perfil — endpoints de usuário, todos protegidos por JWT
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Consulta e atualização de perfil")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final GetUserProfile getUserProfile;
    private final UpdateUserProfile updateUserProfile;

    // GET /api/v1/users/me — retorna o perfil do usuário logado com a streak
    @GetMapping("/me")
    @Operation(summary = "Buscar perfil do usuário autenticado")
    public ResponseEntity<UserDTO> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(getUserProfile.execute(userId));
    }

    // PUT /api/v1/users/me — atualiza os campos do perfil (todos opcionais no body)
    @PutMapping("/me")
    @Operation(summary = "Atualizar perfil do usuário autenticado")
    public ResponseEntity<UserDTO> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateProfileDTO dto
    ) {
        String userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(updateUserProfile.execute(userId, dto));
    }
}
