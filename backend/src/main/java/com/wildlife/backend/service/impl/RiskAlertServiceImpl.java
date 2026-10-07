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

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public List<RiskAlert> getAllAlerts() {
        return riskAlertRepository.findAll();
   }

    @Override
    public RiskAlert getAlert(String alertId) {

        return riskAlertRepository.findByAlertId(alertId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Alert not found: " + alertId
                ));
    }

    @Transactional
    @Override
    public RiskAlert acceptAlert(String alertId) {

        RiskAlert alert = riskAlertRepository.findByAlertId(alertId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Alert not found: " + alertId
                        ));

        if (alert.getStatus() != AlertStatus.DETECTED) {
            throw new IllegalStateException(
                    "Only detected alerts can be accepted."
            );
        }

        alert.setStatus(AlertStatus.ACCEPTED);

        return riskAlertRepository.save(alert);
    }

    @Transactional
    @Override
    public RiskAlert startResponse(String alertId) {

        RiskAlert alert = riskAlertRepository.findByAlertId(alertId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Alert not found: " + alertId
                        ));

        if (alert.getStatus() != AlertStatus.ACCEPTED) {
            throw new IllegalStateException(
                    "Only accepted alerts can start a response."
            );
        }

        alert.setStatus(AlertStatus.RESPONDING);

        return riskAlertRepository.save(alert);
    }

    @Transactional
    @Override
    public RiskAlert resolveAlert(String alertId) {

        RiskAlert alert = riskAlertRepository.findByAlertId(alertId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Alert not found: " + alertId
                        ));

        if (alert.getStatus() != AlertStatus.RESPONDING) {
            throw new IllegalStateException(
                    "Only responding alerts can be resolved."
            );
        }

        alert.setStatus(AlertStatus.RESOLVED);

        return riskAlertRepository.save(alert);
    }

}