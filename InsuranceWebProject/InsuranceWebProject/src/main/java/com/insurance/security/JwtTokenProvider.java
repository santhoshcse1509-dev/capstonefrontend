package com.insurance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * Utility component responsible for creating, parsing, and validating
 * JSON Web Tokens (JWTs) using the <strong>JJWT 0.12.5</strong> library.
 *
 * <h3>Token Types</h3>
 * <ul>
 *   <li><strong>Access Token</strong> – short-lived, carries user identity and
 *       roles as claims. Used for API authorization.</li>
 *   <li><strong>Refresh Token</strong> – longer-lived, used solely to obtain
 *       new access tokens without re-authentication.</li>
 * </ul>
 *
 * <p>The signing key is derived from a hex-encoded secret stored in
 * {@code application.yml} under {@code jwt.secret}.</p>
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    /**
     * Constructs the provider and derives the HMAC signing key once at
     * startup, avoiding repeated key-material parsing on every request.
     *
     * @param secret       hex-encoded secret from {@code jwt.secret}
     * @param expirationMs access-token TTL in milliseconds from {@code jwt.expirationMs}
     */
    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expirationMs}") long expirationMs) {

        // Decode the hex string into raw bytes and build an HMAC-SHA key
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessTokenExpirationMs = expirationMs;
        // Refresh tokens live 7× longer than access tokens (≈7 days default)
        this.refreshTokenExpirationMs = expirationMs * 7;
    }

    // ──────────────────────────────────────────────────────────────
    // Token Generation
    // ──────────────────────────────────────────────────────────────

    /**
     * Generates a short-lived <strong>access token</strong> for the
     * authenticated principal.
     *
     * <p>The token embeds the user's email as the {@code subject} and a
     * comma-separated list of roles under the {@code roles} claim.</p>
     *
     * @param authentication the current authentication context
     * @return a signed JWT access token string
     */
    public String generateAccessToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

        String token = Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .claim("userId", userDetails.getId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();

        log.debug("Access token generated for user: {} (expires: {})",
                userDetails.getUsername(), expiry);
        return token;
    }

    /**
     * Generates a longer-lived <strong>refresh token</strong> for the
     * authenticated principal.
     *
     * <p>Refresh tokens carry only the subject claim; they are not used
     * for authorization directly.</p>
     *
     * @param authentication the current authentication context
     * @return a signed JWT refresh token string
     */
    public String generateRefreshToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpirationMs);

        String token = Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();

        log.debug("Refresh token generated for user: {} (expires: {})",
                userDetails.getUsername(), expiry);
        return token;
    }

    /**
     * Generates a short-lived <strong>MFA temp token</strong> (5 minutes) that
     * identifies the user between the credential-check step and the TOTP
     * verification step. It carries a {@code type=mfa-temp} claim so it
     * cannot be misused as a regular access token.
     *
     * @param email the user's email address
     * @return a signed JWT temp token string
     */
    public String generateTempToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 5 * 60 * 1000L); // 5 minutes

        return Jwts.builder()
                .subject(email)
                .claim("type", "mfa-temp")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validates a temp token and returns the email subject.
     * Throws if the token is invalid or expired.
     *
     * @param token the temp token
     * @return the email stored as subject
     */
    public String getEmailFromTempToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!"mfa-temp".equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Token is not an MFA temp token");
        }
        return claims.getSubject();
    }



    // ──────────────────────────────────────────────────────────────
    // Token Parsing & Validation
    // ──────────────────────────────────────────────────────────────

    /**
     * Extracts the user's email (subject) from a valid JWT.
     *
     * @param token the JWT string
     * @return the email stored as the token's subject
     */
    public String getUserEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /**
     * Validates the given JWT by verifying its signature and checking
     * that it has not expired.
     *
     * @param token the JWT string to validate
     * @return {@code true} if the token is valid; {@code false} otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT token expired: {}", ex.getMessage());
        } catch (JwtException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty or null: {}", ex.getMessage());
        }
        return false;
    }
}
