package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.AlertStatus;

import java.time.LocalDateTime;

public class RiskAlertResponse {

    private String alertId;
    private String animalId;
    private String animalName;
    private Long locationId;
    private Long riskZoneId;
    private String riskZoneName;
    private Double latitude;
    private Double longitude;
    private AlertStatus status;
    private LocalDateTime detectedAt;
    private String assignedResponder;

    public RiskAlertResponse() {
    }

    public RiskAlertResponse(
            String alertId,
            String animalId,
            String animalName,
            Long locationId,
            Long riskZoneId,
            String riskZoneName,
            Double latitude,
            Double longitude,
            AlertStatus status,
            LocalDateTime detectedAt,
            String assignedResponder) {

        this.alertId = alertId;
        this.animalId = animalId;
        this.animalName = animalName;
        this.locationId = locationId;
        this.riskZoneId = riskZoneId;
        this.riskZoneName = riskZoneName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.detectedAt = detectedAt;
        this.assignedResponder = assignedResponder;
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

    public String getRiskZoneName() {
        return riskZoneName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public String getAssignedResponder() {
        return assignedResponder;
    }
}
