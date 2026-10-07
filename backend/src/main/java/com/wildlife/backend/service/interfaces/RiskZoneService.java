package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskZone;

import java.util.Optional;

public interface RiskZoneService {

    Optional<RiskZone> findContainingZone(GPSLocation location);
}