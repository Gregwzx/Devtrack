// JwtService.java
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    private static final long ACCESS_TTL  = 15 * 60 * 1000;        // 15min
    private static final long REFRESH_TTL = 7 * 24 * 60 * 60 * 1000; // 7d

    public String generateAccess(String userId) {
        return Jwts.builder()
            .subject(userId)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + ACCESS_TTL))
            .signWith(getKey())
            .compact();
    }

    public String generateRefresh(String userId) {
        return Jwts.builder()
            .subject(userId)
            .claim("type", "refresh")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + REFRESH_TTL))
            .signWith(getKey())
            .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parser()
            .verifyWith(getKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }
}