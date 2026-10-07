package com.wildlife.backend.dto;

import com.wildlife.backend.entity.AlertStatus;

import java.time.LocalDateTime;

public class RiskAlertResponse {

    private String alertId;
    private String animalId;
    private String animalName;
    private Long locationId;
    private Long riskZoneId;
    private AlertStatus status;
    private LocalDateTime detectedAt;

    public RiskAlertResponse() {
    }

    public RiskAlertResponse(
            String alertId,
            String animalId,
            String animalName,
            Long locationId,
            Long riskZoneId,
            AlertStatus status,
            LocalDateTime detectedAt) {

        this.alertId = alertId;
        this.animalId = animalId;
        this.animalName = animalName;
        this.locationId = locationId;
        this.riskZoneId = riskZoneId;
        this.status = status;
        this.detectedAt = detectedAt;
    }

    public String getAlertId() {
        return alertId;
    }

    public String getAnimalId() {
        return animalId;
    }

    public String getAnimalName() {
        return animalName;
    }

    public Long getLocationId() {
        return locationId;
    }

    public Long getRiskZoneId() {
        return riskZoneId;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }
}