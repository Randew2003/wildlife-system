package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.AlertStatus;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.RiskAlertRepository;
import com.wildlife.backend.service.interfaces.RiskAlertService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RiskAlertServiceImpl implements RiskAlertService {

    private final RiskAlertRepository riskAlertRepository;

    public RiskAlertServiceImpl(
            RiskAlertRepository riskAlertRepository) {

        this.riskAlertRepository = riskAlertRepository;
    }

    @Override
    public RiskAlert createAlert(
            GPSLocation location,
            RiskZone riskZone) {

        /*
         * These statuses mean that an alert is still active.
         *
         * If an alert is in one of these states, we should
         * NOT create another alert for the same animal
         * and risk zone.
         */
        List<AlertStatus> activeStatuses = List.of(
                AlertStatus.DETECTED,
                AlertStatus.ACCEPTED,
                AlertStatus.RESPONDING
        );

        /*
         * Check whether this animal already has an active
         * alert for this same risk zone.
         */
        var existingAlert =
                riskAlertRepository
                        .findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
                                location.getAnimal().getId(),
                                riskZone.getId(),
                                activeStatuses
                        );

        /*
         * An active alert already exists.
         *
         * Therefore, do not create a duplicate alert.
         */
        if (existingAlert.isPresent()) {

            System.out.println(
                    "Existing active alert found. "
                    + "No duplicate alert created: "
                    + existingAlert.get().getAlertId()
            );

            return existingAlert.get();
        }

        /*
         * No active alert exists.
         *
         * Therefore, create a new risk alert.
         */
        String alertId =
                "ALERT-" + UUID.randomUUID();

        RiskAlert alert = new RiskAlert(
                alertId,
                location.getAnimal(),
                location,
                riskZone,
                AlertStatus.DETECTED,
                LocalDateTime.now()
        );

        RiskAlert savedAlert =
                riskAlertRepository.save(alert);

        System.out.println(
                "New risk alert created: "
                        + savedAlert.getAlertId()
        );

        return savedAlert;
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
                                "Alert not found: "
                                        + alertId
                        ));
    }

    @Transactional
    @Override
    public RiskAlert acceptAlert(String alertId) {

        RiskAlert alert =
                riskAlertRepository.findByAlertId(alertId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Alert not found: "
                                                + alertId
                                ));

        /*
         * Only DETECTED alerts can be accepted.
         */
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

        RiskAlert alert =
                riskAlertRepository.findByAlertId(alertId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Alert not found: "
                                                + alertId
                                ));

        /*
         * Only ACCEPTED alerts can start a response.
         */
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

        RiskAlert alert =
                riskAlertRepository.findByAlertId(alertId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Alert not found: "
                                                + alertId
                                ));

        /*
         * Only RESPONDING alerts can be resolved.
         */
        if (alert.getStatus() != AlertStatus.RESPONDING) {

            throw new IllegalStateException(
                    "Only responding alerts can be resolved."
            );
        }

        alert.setStatus(AlertStatus.RESOLVED);

        return riskAlertRepository.save(alert);
    }
}