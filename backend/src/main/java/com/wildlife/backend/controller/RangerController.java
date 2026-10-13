package com.wildlife.backend.controller;

import com.wildlife.backend.entity.UserAccount;
import com.wildlife.backend.entity.UserRole;
import com.wildlife.backend.entity.Ranger;
import com.wildlife.backend.repository.RangerRepository;
import com.wildlife.backend.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/rangers")
public class RangerController {

    private final RangerRepository rangerRepository;
    private final UserAccountRepository userAccountRepository;

    public RangerController(
            RangerRepository rangerRepository,
            UserAccountRepository userAccountRepository) {

        this.rangerRepository = rangerRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public ResponseEntity<List<Ranger>> getAllRangers() {
        List<Ranger> rangers = userAccountRepository
                .findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole.RANGER)
                .stream()
                .map(UserAccount::getRangerId)
                .filter(rangerId -> rangerId != null && !rangerId.isBlank())
                .map(rangerRepository::findByRangerId)
                .flatMap(Optional::stream)
                .toList();

        return ResponseEntity.ok(rangers);
    }

    @GetMapping("/{rangerId}")
    public ResponseEntity<Ranger> getRanger(@PathVariable String rangerId) {
        if (!userAccountRepository.existsByRangerIdAndRoleAndEnabledTrue(
                rangerId,
                UserRole.RANGER)) {

            throw new IllegalArgumentException(
                    "Active ranger account not found: " + rangerId);
        }

        return ResponseEntity.ok(
                rangerRepository
                        .findByRangerId(rangerId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ranger not found: " + rangerId))
        );
    }
}
