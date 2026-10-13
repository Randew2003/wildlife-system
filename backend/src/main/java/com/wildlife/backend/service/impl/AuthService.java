package com.wildlife.backend.service.impl;

import com.wildlife.backend.dto.request.ForgotPasswordRequest;
import com.wildlife.backend.dto.request.LoginRequest;
import com.wildlife.backend.dto.request.RegisterRequest;
import com.wildlife.backend.dto.response.AuthResponse;
import com.wildlife.backend.entity.Ranger;
import com.wildlife.backend.entity.UserAccount;
import com.wildlife.backend.entity.UserRole;
import com.wildlife.backend.repository.RangerRepository;
import com.wildlife.backend.repository.UserAccountRepository;
import com.wildlife.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final RangerRepository rangerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            RangerRepository rangerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userAccountRepository = userAccountRepository;
        this.rangerRepository = rangerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = normalizeEmail(request.getEmail());

        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        String rangerId = normalizeBlank(request.getRangerId());

        if (request.getRole() == UserRole.RANGER) {
            if (rangerId == null) {
                rangerId = "RGR-" + System.currentTimeMillis();
            }

            String finalRangerId = rangerId;
            rangerRepository
                    .findByRangerId(finalRangerId)
                    .orElseGet(() ->
                            rangerRepository.save(new Ranger(
                                    finalRangerId,
                                    request.getFullName().trim()
                            )));
        }

        UserAccount user = new UserAccount(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRole(),
                rangerId,
                true,
                LocalDateTime.now()
        );

        UserAccount savedUser = userAccountRepository.save(user);

        return toResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {

        UserAccount user = userAccountRepository
                .findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .filter(UserAccount::isEnabled)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {

            throw new IllegalArgumentException("Invalid email or password.");
        }

        return toResponse(user);
    }

    public AuthResponse me(String authorizationHeader) {

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            throw new IllegalArgumentException("Authorization token is required.");
        }

        String token = authorizationHeader.substring(7);

        if (!jwtService.isValid(token)) {
            throw new IllegalArgumentException("Authorization token is invalid or expired.");
        }

        String email = jwtService.extractEmail(token);

        UserAccount user = userAccountRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Authenticated user was not found."));

        return toResponse(user);
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()));
    }

    private AuthResponse toResponse(UserAccount user) {

        Long rangerDatabaseId = null;

        if (user.getRangerId() != null) {
            rangerDatabaseId = rangerRepository
                    .findByRangerId(user.getRangerId())
                    .map(Ranger::getId)
                    .orElse(null);
        }

        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getRangerId(),
                rangerDatabaseId,
                jwtService.generateToken(user)
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
