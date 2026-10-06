package com.wildlife.backend.repository;

import com.wildlife.backend.entity.RiskAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, Long> {

    Optional<RiskAlert> findByAlertId(String alertId);
}