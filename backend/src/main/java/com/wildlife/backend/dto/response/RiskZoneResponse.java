package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.RiskZone;

public class RiskZoneResponse {

    private Long id;
    private String zoneName;
    private double centerLatitude;
    private double centerLongitude;
    private double radiusMeters;
    private boolean active;

    public RiskZoneResponse() {
    }

    public RiskZoneResponse(
            Long id,
            String zoneName,
            double centerLatitude,
            double centerLongitude,
            double radiusMeters,
            boolean active) {

        this.id = id;
        this.zoneName = zoneName;
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
        this.radiusMeters = radiusMeters;
        this.active = active;
    }

    public static RiskZoneResponse fromEntity(RiskZone riskZone) {

        return new RiskZoneResponse(
                riskZone.getId(),
                riskZone.getZoneName(),
                riskZone.getCenterLatitude(),
                riskZone.getCenterLongitude(),
                riskZone.getRadiusMeters(),
                riskZone.isActive()
        );
    }

    public Long getId() {
        return id;
    }

    public String getZoneName() {
        return zoneName;
    }

    public double getCenterLatitude() {
        return centerLatitude;
    }

    public double getCenterLongitude() {
        return centerLongitude;
    }

    public double getRadiusMeters() {
        return radiusMeters;
    }

    public boolean isActive() {
        return active;
    }
}