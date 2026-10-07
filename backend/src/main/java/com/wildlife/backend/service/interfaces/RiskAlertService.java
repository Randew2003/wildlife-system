package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;

public interface RiskAlertService {

    RiskAlert createAlert(
            GPSLocation location,
            RiskZone riskZone
    );
}