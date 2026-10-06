package com.wildlife.backend.repository;

import com.wildlife.backend.entity.RiskZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskZoneRepository extends JpaRepository<RiskZone, Long> {

    List<RiskZone> findByActiveTrue();
}