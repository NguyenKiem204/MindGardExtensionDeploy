package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.config.JwtProperties;
import com.kiemnv.MindGardAPI.dto.request.LoginRequest;
import com.kiemnv.MindGardAPI.dto.request.RegisterRequest;
import com.kiemnv.MindGardAPI.dto.response.AuthResponse;
import com.kiemnv.MindGardAPI.entity.RefreshToken;
import com.kiemnv.MindGardAPI.entity.Role;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.UserStatus;
import com.kiemnv.MindGardAPI.exception.PendingApprovalException;
import com.kiemnv.MindGardAPI.exception.TokenException;
import com.kiemnv.MindGardAPI.exception.UserAccountStatusException;
import com.kiemnv.MindGardAPI.exception.UserAlreadyExistsException;
import com.kiemnv.MindGardAPI.repository.RefreshTokenRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.kiemnv.MindGardAPI.entity.Provider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    @Value("${oauth2.google.client-id:}")
    private String googleClientId;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();

        userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        saveRefreshToken(user, refreshToken);

        addRefreshTokenCookie(response, refreshToken);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse googleLogin(String idTokenString, HttpServletResponse response) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String firstName = (String) payload.get("given_name");
                String lastName = (String) payload.get("family_name");
                String pictureUrl = (String) payload.get("picture");
                
                return processOAuthPostLogin(email, firstName, lastName, pictureUrl, Provider.GOOGLE, response);
            } else {
                throw new RuntimeException("Invalid ID token.");
            }
        } catch (Exception e) {
            log.error("Google verify error", e);
            throw new RuntimeException("Google authentication failed", e);
        }
    }

    @Transactional
    public AuthResponse facebookLogin(String accessToken, HttpServletResponse response) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=" + accessToken;
            Map<String, Object> params = restTemplate.getForObject(url, Map.class);
            if (params == null || !params.containsKey("email")) {
                throw new RuntimeException("Cannot retrieve email from Facebook");
            }
            
            String email = (String) params.get("email");
            String name = (String) params.get("name");
            String firstName = name;
            String lastName = "";
            if (name != null && name.contains(" ")) {
                firstName = name.substring(0, name.indexOf(" "));
                lastName = name.substring(name.indexOf(" ") + 1);
            }
            
            String pictureUrl = null;
            if (params.containsKey("picture")) {
                Map<String, Object> pictureObj = (Map<String, Object>) params.get("picture");
                if (pictureObj.containsKey("data")) {
                    Map<String, Object> dataObj = (Map<String, Object>) pictureObj.get("data");
                    if (dataObj.containsKey("url")) {
                        pictureUrl = (String) dataObj.get("url");
                    }
                }
            }
            
            return processOAuthPostLogin(email, firstName, lastName, pictureUrl, Provider.FACEBOOK, response);
        } catch (Exception e) {
            log.error("Facebook verify error", e);
            throw new RuntimeException("Facebook authentication failed", e);
        }
    }

    private AuthResponse processOAuthPostLogin(String email, String firstName, String lastName, String avatarUrl, Provider provider, HttpServletResponse response) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .username(email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 5))
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // dummy password
                    .firstName(firstName)
                    .lastName(lastName)
                    .avatarUrl(avatarUrl)
                    .roles(Set.of(Role.USER))
                    .status(UserStatus.ACTIVE)
                    .provider(provider)
                    .build();
            user = userRepository.save(user);
        }

        userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        saveRefreshToken(user, newRefreshToken);
        addRefreshTokenCookie(response, newRefreshToken);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }


    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roles(Set.of(Role.USER))
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        saveRefreshToken(user, refreshToken);

        addRefreshTokenCookie(response, refreshToken);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(String oldRefreshToken, HttpServletResponse response) {
        if (!jwtService.validateToken(oldRefreshToken, "refresh")) {
            refreshTokenRepository.revokeToken(oldRefreshToken);
            throw new TokenException("Invalid refresh token");
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(oldRefreshToken)
                .orElseThrow(() -> new TokenException("Invalid refresh token"));

        HttpServletRequest currentRequest = getCurrentRequest();
        String currentIpAddress = currentRequest != null ? getClientIpAddress(currentRequest) : "Unknown";

        if (!storedToken.getIpAddress().equals(currentIpAddress)) {
            log.warn("Refresh token used from different IP. Revoking token. Original IP: {}, Current IP: {}",
                    storedToken.getIpAddress(), currentIpAddress);
            refreshTokenRepository.revokeToken(oldRefreshToken);
            throw new TokenException("Refresh token used from unauthorized location.");
        }

        if (!storedToken.isValid()) {
            refreshTokenRepository.revokeToken(oldRefreshToken);
            throw new TokenException("Refresh token is expired or revoked");
        }

        User user = storedToken.getUser();

        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            refreshTokenRepository.revokeToken(oldRefreshToken);
            throw new PendingApprovalException("Account is pending approval. Please wait for admin approval.");
        } else if (user.getStatus() != UserStatus.ACTIVE) {
            refreshTokenRepository.revokeToken(oldRefreshToken);
            throw new UserAccountStatusException("Your account is " + user.getStatus().name().toLowerCase() + ". Please contact support.");
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.revokeToken(oldRefreshToken);
        saveRefreshToken(user, newRefreshToken);

        addRefreshTokenCookie(response, newRefreshToken);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> refreshTokenRepository.revokeToken(refreshToken));
    }

    @Transactional
    public void logoutAll(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    private void saveRefreshToken(User user, String token) {
        HttpServletRequest request = getCurrentRequest();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiration() / 1000))
                .deviceInfo(request != null ? request.getHeader("User-Agent") : "Unknown")
                .ipAddress(request != null ? getClientIpAddress(request) : "Unknown")
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        long maxAgeSeconds = jwtProperties.getRefreshTokenExpiration() / 1000;

        String cookieValue = String.format("%s=%s; Path=/api/auth/refresh; HttpOnly; Secure; Max-Age=%d; SameSite=Strict",
                "refreshToken",
                refreshToken,
                maxAgeSeconds);

        response.addHeader("Set-Cookie", cookieValue);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.name())
                .collect(Collectors.toSet());

        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roles)
                .avatarUrl(user.getAvatarUrl())
                .phoneNumber(user.getPhoneNumber())
                .level(user.getLevel())
                .currentXP(user.getCurrentXP())
                .xpToNextLevel(user.getXpToNextLevel())
                .lastLogin(user.getLastLogin())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenExpiration() / 1000)
                .user(userInfo)
                .build();
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
