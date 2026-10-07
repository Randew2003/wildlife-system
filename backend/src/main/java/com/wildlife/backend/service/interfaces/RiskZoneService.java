package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskZone;

import java.util.List;
import java.util.Optional;

public interface RiskZoneService {

    RiskZone createRiskZone(RiskZone riskZone);

    List<RiskZone> getAllRiskZones();

    RiskZone getRiskZone(Long id);

    RiskZone updateRiskZone(Long id, RiskZone riskZone);

    void deleteRiskZone(Long id);

    Optional<RiskZone> findContainingZone(GPSLocation location);
}