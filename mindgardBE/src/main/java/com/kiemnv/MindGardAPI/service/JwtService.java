package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.config.JwtProperties;
import com.kiemnv.MindGardAPI.entity.User;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    public String generateAccessToken(User user) {
        try {
            JWSSigner signer = new MACSigner(jwtProperties.getSecretKey().getBytes());

            Instant now = Instant.now();
            Instant expiration = now.plusMillis(jwtProperties.getAccessTokenExpiration());

            Set<String> roles = user.getRoles().stream()
                    .map(role -> "ROLE_" + role.name())
                    .collect(Collectors.toSet());

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getUsername())
                    .issuer(jwtProperties.getIssuer())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiration))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("tokenType", "access")
                    .claim("userId", user.getId())
                    .claim("roles", roles)
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.HS512)
                            .type(JOSEObjectType.JWT)
                            .build(),
                    claimsSet
            );

            signedJWT.sign(signer);
            return signedJWT.serialize();

        } catch (JOSEException e) {
            log.error("Error generating access token", e);
            throw new RuntimeException("Could not generate access token", e);
        }
    }

    public String generateRefreshToken(User user) {
        try {
            JWSSigner signer = new MACSigner(jwtProperties.getSecretKey().getBytes());

            Instant now = Instant.now();
            Instant expiration = now.plusMillis(jwtProperties.getRefreshTokenExpiration());

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getUsername())
                    .issuer(jwtProperties.getIssuer())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiration))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("userId", user.getId())
                    .claim("tokenType", "refresh")
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.HS512)
                            .type(JOSEObjectType.JWT)
                            .build(),
                    claimsSet
            );

            signedJWT.sign(signer);
            return signedJWT.serialize();

        } catch (JOSEException e) {
            log.error("Error generating refresh token", e);
            throw new RuntimeException("Could not generate refresh token", e);
        }
    }

    public boolean validateToken(String token, String expectedTokenType) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(jwtProperties.getSecretKey().getBytes());

            if (!signedJWT.verify(verifier)) {
                return false;
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
                return false;
            }
            if (claims.getIssuer() == null || !claims.getIssuer().equals(jwtProperties.getIssuer())) {
                return false;
            }
            if (expectedTokenType != null) {
                String tokenType = (String) claims.getClaim("tokenType");
                return expectedTokenType.equals(tokenType);
            }
            return true;

        } catch (ParseException | JOSEException e) {
            log.debug("Invalid token: {}", e.getMessage());
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            log.error("Error extracting username from token", e);
            throw new RuntimeException("Could not extract username from token", e);
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getLongClaim("userId");
        } catch (ParseException e) {
            log.error("Error extracting user ID from token", e);
            throw new RuntimeException("Could not extract user ID from token", e);
        }
    }

    public Date getExpirationFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getExpirationTime();
        } catch (ParseException e) {
            log.error("Error extracting expiration from token", e);
            throw new RuntimeException("Could not extract expiration from token", e);
        }
    }
}

