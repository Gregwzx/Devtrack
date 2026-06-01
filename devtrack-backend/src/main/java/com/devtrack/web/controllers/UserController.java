package com.devtrack.web.controllers;

import com.devtrack.application.dtos.RankingUserDTO;
import com.devtrack.application.dtos.UpdateProfileDTO;
import com.devtrack.application.dtos.UserDTO;
import com.devtrack.application.usecases.GetRanking;
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

import java.util.List;

// controller de perfil — endpoints de usuário, todos protegidos por JWT
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Consulta e atualização de perfil")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final GetUserProfile getUserProfile;
    private final UpdateUserProfile updateUserProfile;
    private final GetRanking getRanking;

    // GET /api/v1/users/me — retorna o perfil do usuário logado com a streak
    @GetMapping("/me")
    @Operation(summary = "Buscar perfil do usuário autenticado")
    public ResponseEntity<UserDTO> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(getUserProfile.execute(userId));
    }

    // PUT /api/v1/users/me — atualiza os campos do perfil (todos opcionais no body)
    @PutMapping("/me")
    @Operation(summary = "Atualizar perfil do usuário autenticado")
    public ResponseEntity<UserDTO> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateProfileDTO dto
    ) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(updateUserProfile.execute(userId, dto));
    }

    // PUT /api/v1/users/me/lives — gerencia as vidas do sistema de gamificação
    // actions: "lose" | "restore" | "refill"
    @PutMapping("/me/lives")
    @Operation(summary = "Gerenciar vidas do sistema de gamificação")
    public ResponseEntity<UserDTO> updateLives(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody java.util.Map<String, String> body
    ) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(updateUserProfile.updateLives(userId, body.get("action")));
    }

    // GET /api/v1/users/ranking?sortBy=streak&limit=50
    // Ranking global de todos os usuários cadastrados
    // Parâmetros opcionais: sortBy = "streak" | "xp" | "learnings" (padrão: streak)
    //                       limit = número de resultados (padrão: 50)
    @GetMapping("/ranking")
    @Operation(summary = "Ranking global dos usuários")
    public ResponseEntity<List<RankingUserDTO>> getRanking(
            @RequestParam(defaultValue = "streak") String sortBy,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(getRanking.execute(sortBy, Math.min(limit, 100)));
    }
}
