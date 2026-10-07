package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;

import java.util.List;

public interface RiskAlertService {

    RiskAlert createAlert(
            GPSLocation location,
            RiskZone riskZone
    );

    List<RiskAlert> getAllAlerts();

    RiskAlert getAlert(String alertId);

    RiskAlert acceptAlert(String alertId);

    RiskAlert startResponse(String alertId);

    RiskAlert resolveAlert(String alertId);
}