package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.UserAccount;
import com.wildlife.backend.entity.UserRole;

public class ResponderResponse {

    private Long id;
    private String responderId;
    private String fullName;
    private String email;
    private UserRole role;

    public ResponderResponse(
            Long id,
            String responderId,
            String fullName,
            String email,
            UserRole role) {

        this.id = id;
        this.responderId = responderId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    public static ResponderResponse fromEntity(UserAccount user) {
        String responderId = user.getRangerId() == null
                ? user.getEmail()
                : user.getRangerId();

        return new ResponderResponse(
                user.getId(),
                responderId,
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public Long getId() {
        return id;
    }

    public String getResponderId() {
        return responderId;
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
}
