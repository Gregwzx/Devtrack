package com.devtrack.web.controllers;

import com.devtrack.application.dtos.CreateLearningDTO;
import com.devtrack.application.dtos.LearningDTO;
import com.devtrack.application.usecases.GetUserLearnings;
import com.devtrack.application.usecases.RegisterLearning;
import com.devtrack.infrastructure.security.CustomUserDetails;
import com.devtrack.web.exceptions.ResourceNotFoundException;
import com.devtrack.domain.repositories.LearningRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// controller de aprendizados — todos os endpoints exigem JWT
@RestController
@RequestMapping("/api/v1/learnings")
@RequiredArgsConstructor
@Tag(name = "Aprendizados", description = "Registro e consulta de aprendizados do usuário")
@SecurityRequirement(name = "bearerAuth") // aparece o cadeado no Swagger
public class LearningController {

    private final RegisterLearning registerLearning;
    private final GetUserLearnings getUserLearnings;
    private final LearningRepository learningRepository;

    // POST /api/v1/learnings — salva um aprendizado e atualiza a streak
    @PostMapping
    @Operation(summary = "Registrar novo aprendizado")
    public ResponseEntity<LearningDTO> create(
            @AuthenticationPrincipal UserDetails userDetails, // usuário injetado do JWT pelo Spring
            @RequestBody @Valid CreateLearningDTO dto
    ) {
        Long userId = ((CustomUserDetails) userDetails).getId(); // pega o ID do token
        return ResponseEntity.status(201).body(registerLearning.execute(userId, dto));
    }

    // GET /api/v1/learnings?page=0&size=20 — lista paginada dos aprendizados
    @GetMapping
    @Operation(summary = "Listar aprendizados (paginado)")
    public ResponseEntity<Page<LearningDTO>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(getUserLearnings.execute(userId, page, size));
    }

    // DELETE /api/v1/learnings/{id} — deleta um aprendizado (só o dono pode)
    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar aprendizado")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = ((CustomUserDetails) userDetails).getId();
        var learning = learningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aprendizado não encontrado: " + id));

        // segurança extra — verifica se quem tá deletando é o dono
        if (!learning.getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).build(); // 403 Forbidden
        }

        learningRepository.delete(learning);
        return ResponseEntity.noContent().build(); // 204 sem body
    }
}