package com.devtrack.application.usecases;

import com.devtrack.application.dtos.AuthResponseDTO;
import com.devtrack.application.dtos.LoginDTO;
import com.devtrack.application.dtos.RegisterDTO;
import com.devtrack.application.dtos.UserDTO;
import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.UserRepository;
import com.devtrack.infrastructure.security.JwtService;
import com.devtrack.web.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// serviço de autenticação — cadastro, login e renovação de token
// chamado pelo AuthController
@Service
@RequiredArgsConstructor // Lombok gera o construtor com as dependências abaixo
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // BCrypt
    private final JwtService jwtService;           // gera e valida JWT
    private final AuthenticationManager authenticationManager; // valida credenciais

    // POST /api/v1/auth/register
    public AuthResponseDTO register(RegisterDTO dto) {
        // bloqueia email duplicado antes de salvar
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("E-mail já cadastrado");
        }

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword())) // hash BCrypt aqui
                .studyArea("fullstack")
                .bannerColor("#1a1040")
                .build();

        user = userRepository.save(user); // INSERT no banco

        return buildResponse(user);
    }

    // POST /api/v1/auth/login
    public AuthResponseDTO login(LoginDTO dto) {
        // Spring Security valida email + senha contra o banco
        // lança BadCredentialsException se errar → retorna 401
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));

        return buildResponse(user);
    }

    // POST /api/v1/auth/refresh — renova o access token usando o refresh token
    public AuthResponseDTO refresh(String refreshToken) {
        if (!jwtService.isValid(refreshToken)) {
            throw new BusinessException("Token de refresh inválido ou expirado");
        }
        // extractUserId retorna String — converter para Long (BIGINT)
        Long userId = Long.parseLong(jwtService.extractUserId(refreshToken));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));

        return buildResponse(user);
    }

    // monta a resposta padrão com os dois tokens + dados do usuário
    private AuthResponseDTO buildResponse(User user) {
        return AuthResponseDTO.builder()
                .accessToken(jwtService.generateAccess(user.getId()))   // válido 15 min
                .refreshToken(jwtService.generateRefresh(user.getId())) // válido 7 dias
                .user(UserDTO.from(user)) // converte pra DTO — sem expor a senha
                .build();
    }
}
