package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.UserRole;

public class AuthResponse {

    private Long userId;
    private String fullName;
    private String email;
    private UserRole role;
    private String rangerId;
    private Long rangerDatabaseId;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(
            Long userId,
            String fullName,
            String email,
            UserRole role,
            String rangerId,
            Long rangerDatabaseId,
            String token) {

        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.rangerId = rangerId;
        this.rangerDatabaseId = rangerDatabaseId;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public UserRole getRole() {
        return role;
    }

    public String getRangerId() {
        return rangerId;
    }

    public Long getRangerDatabaseId() {
        return rangerDatabaseId;
    }

    public String getToken() {
        return token;
    }
}
