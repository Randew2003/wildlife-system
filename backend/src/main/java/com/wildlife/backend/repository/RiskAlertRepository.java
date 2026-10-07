package com.wildlife.backend.repository;

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
}