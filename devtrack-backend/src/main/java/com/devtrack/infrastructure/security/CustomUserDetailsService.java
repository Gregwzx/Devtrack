package com.devtrack.infrastructure.security;

import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// carrega o usuário do banco pra ser usado pelo Spring Security
// chamado no login e em toda requisição autenticada pelo JwtFilter
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // o parâmetro se chama "username" mas aqui usamos o userId (UUID)
    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + userId));
        return new CustomUserDetails(user); // encapsula no objeto do Spring Security
    }
}
