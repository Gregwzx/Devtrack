package com.devtrack.infrastructure.security;

import com.devtrack.domain.entities.User;
import com.devtrack.domain.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// carrega o usuário do banco pra ser usado pelo Spring Security
// chamado no login (Spring passa o email) e pelo JwtFilter (passa o userId)
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // IMPORTANTE: o Spring Security chama este método com o "username" que é o EMAIL.
    // O AuthenticationManager (no login) passa dto.getEmail() aqui.
    // O JwtFilter NÃO usa este método — ele extrai o userId do token e injeta diretamente.
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
        return new CustomUserDetails(user); // encapsula no objeto do Spring Security
    }
}
