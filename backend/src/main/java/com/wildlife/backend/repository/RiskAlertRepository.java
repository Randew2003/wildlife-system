package com.wildlife.backend.repository;

import com.wildlife.backend.entity.AlertStatus;
import com.wildlife.backend.entity.RiskAlert;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, Long> {

    @EntityGraph(attributePaths = {
            "animal",
            "location",
            "riskZone"
    })
    List<RiskAlert> findAll();

    @EntityGraph(attributePaths = {
            "animal",
            "location",
            "riskZone"
    })
    Optional<RiskAlert> findByAlertId(String alertId);

    /*
     * Finds the latest active alert for the same animal
     * and the same risk zone.
     *
     * DETECTED, ACCEPTED and RESPONDING are considered
     * active alert states.
     *
     * This is used to prevent duplicate alerts when the
     * same animal sends multiple GPS updates while it
     * remains inside the same risk zone.
     */
    Optional<RiskAlert>
    findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
            Long animalId,
            Long riskZoneId,
            List<AlertStatus> statuses
    );
}