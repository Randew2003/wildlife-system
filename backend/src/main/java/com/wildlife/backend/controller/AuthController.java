package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.ForgotPasswordRequest;
import com.wildlife.backend.dto.request.LoginRequest;
import com.wildlife.backend.dto.request.RegisterRequest;
import com.wildlife.backend.dto.response.AuthResponse;
import com.wildlife.backend.service.impl.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(
            @RequestHeader("Authorization") String authorizationHeader) {

        return ResponseEntity.ok(authService.me(authorizationHeader));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.requestPasswordReset(request);

        return ResponseEntity.ok(Map.of(
                "message",
                "If an account exists, password reset instructions will be sent."
        ));
    }
}
