package com.wildlife.backend.controller;

import com.wildlife.backend.dto.response.ResponderResponse;
import com.wildlife.backend.entity.UserRole;
import com.wildlife.backend.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/responders")
public class ResponderController {

    private final UserAccountRepository userAccountRepository;

    public ResponderController(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public ResponseEntity<List<ResponderResponse>> getResponders() {
        List<ResponderResponse> responders = userAccountRepository
                .findByRoleAndEnabledTrueOrderByFullNameAsc(
                        UserRole.COMMUNITY_LIAISON_OFFICER)
                .stream()
                .map(ResponderResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(responders);
    }
}
