package com.dentsbackend.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenUtil.class);
    private static final long EXPIRATION_TIME = 864000000L; // 10 days
    private static volatile String activeSecret = resolveInitialSecret();

    @Value("${jwt.secret:}")
    private String configuredSecret;

    @Value("${app.env:dev}")
    private String appEnv;

    private static String resolveInitialSecret() {
        String envSecret = System.getenv("JWT_SECRET");
        if (envSecret != null && envSecret.trim().length() >= 32) {
            return envSecret.trim();
        }
        return generateEphemeralSecret();
    }

    private static String generateEphemeralSecret() {
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    @PostConstruct
    public void init() {
        String candidate = configuredSecret != null ? configuredSecret.trim() : "";
        if (candidate.isEmpty()) {
            String env = System.getenv("JWT_SECRET");
            candidate = env != null ? env.trim() : "";
        }

        if ("prod".equalsIgnoreCase(appEnv)) {
            if (candidate.length() < 32) {
                throw new IllegalStateException(
                        "JWT_SECRET environment variable must be configured (minimum 32 characters) when APP_ENV=prod.");
            }
            activeSecret = candidate;
        } else if (candidate.length() >= 32) {
            activeSecret = candidate;
        } else {
            if (activeSecret == null || activeSecret.length() < 32) {
                activeSecret = generateEphemeralSecret();
            }
            logger.warn("JWT_SECRET not set or shorter than 32 chars; using ephemeral development key.");
        }
    }

    private static Key getSigningKey() {
        byte[] keyBytes = activeSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public static String generateToken(String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public static String extractSubject(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                return null;
            }
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean validateToken(String token, String subject) {
        String extracted = extractSubject(token);
        return extracted != null && extracted.equals(subject);
    }
}
