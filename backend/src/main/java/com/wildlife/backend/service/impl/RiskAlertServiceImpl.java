package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.AlertStatus;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.RiskAlertRepository;
import com.wildlife.backend.service.interfaces.RiskAlertService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RiskAlertServiceImpl implements RiskAlertService {

    private final RiskAlertRepository riskAlertRepository;

    public RiskAlertServiceImpl(RiskAlertRepository riskAlertRepository) {
        this.riskAlertRepository = riskAlertRepository;
    }

    @Override
    public RiskAlert createAlert(
            GPSLocation location,
            RiskZone riskZone) {

        String alertId = "ALERT-" + UUID.randomUUID();

        RiskAlert alert = new RiskAlert(
                alertId,
                location.getAnimal(),
                location,
                riskZone,
                AlertStatus.DETECTED,
                LocalDateTime.now()
        );

        return riskAlertRepository.save(alert);
    }
}