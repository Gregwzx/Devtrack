package com.devtrack.web.controllers;

import com.devtrack.application.dtos.AuthResponseDTO;
import com.devtrack.application.dtos.LoginDTO;
import com.devtrack.application.dtos.RegisterDTO;
import com.devtrack.application.usecases.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// controller de autenticação — rotas públicas (sem JWT)
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Cadastro, login e renovação de token")
public class AuthController {

    private final AuthService authService;

    // POST /api/v1/auth/register — cria conta nova, retorna 201 + tokens
    @PostMapping("/register")
    @Operation(summary = "Cadastrar novo usuário")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody @Valid RegisterDTO dto) {
        return ResponseEntity.status(201).body(authService.register(dto));
    }

    // POST /api/v1/auth/login — autentica e retorna os tokens JWT
    @PostMapping("/login")
    @Operation(summary = "Fazer login e obter JWT")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    // POST /api/v1/auth/refresh — renova o access token sem precisar fazer login de novo
    // o refresh token vai no header X-Refresh-Token (não no body)
    @PostMapping("/refresh")
    @Operation(summary = "Renovar access token usando refresh token")
    public ResponseEntity<AuthResponseDTO> refresh(
            @RequestHeader("X-Refresh-Token") String refreshToken
    ) {
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }
}
