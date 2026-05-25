package com.devtrack.infrastructure.security;

import com.devtrack.domain.entities.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

// adapta nossa entidade User pro padrão que o Spring Security espera (UserDetails)
public class CustomUserDetails implements UserDetails {

    @Getter
    private final String id; // campo extra — Spring Security não tem isso por padrão
    private final String email;
    private final String passwordHash;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
    }

    @Override public String getUsername()              { return email; }
    @Override public String getPassword()              { return passwordHash; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // sem roles por enquanto
    }
}
