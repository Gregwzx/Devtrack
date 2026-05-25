package com.devtrack.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

// serviço responsável por gerar e validar tokens JWT
@Service
public class JwtService {

    @Value("${jwt.secret}") // vem do application.properties
    private String secret;

    private static final long ACCESS_TTL  = 15 * 60 * 1000L;           // access token: 15 minutos
    private static final long REFRESH_TTL = 7 * 24 * 60 * 60 * 1000L; // refresh token: 7 dias

    // gera o access token com o userId no campo "sub" do payload
    public String generateAccess(String userId) {
        return Jwts.builder()
                .subject(userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TTL))
                .signWith(getKey()) // assina com HMAC-SHA256
                .compact();
    }

    // gera o refresh token — tem o campo extra "type":"refresh"
    public String generateRefresh(String userId) {
        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TTL))
                .signWith(getKey())
                .compact();
    }

    // extrai o userId do payload do token (campo "sub")
    public String extractUserId(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // verifica assinatura + expiração — retorna false se inválido
    public boolean isValid(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // decodifica a secret Base64 do properties e monta a chave de assinatura
    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }
}
