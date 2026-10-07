package com.wildlife.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "risk_zones")
public class RiskZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String zoneName;

    @Column(nullable = false)
    private double centerLatitude;

    @Column(nullable = false)
    private double centerLongitude;

    @Column(nullable = false)
    private double radiusMeters;

    @Column(nullable = false)
    private boolean active;

    public RiskZone() {
    }

    public RiskZone(
            String zoneName,
            double centerLatitude,
            double centerLongitude,
            double radiusMeters,
            boolean active) {

        this.zoneName = zoneName;
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
        this.radiusMeters = radiusMeters;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public double getCenterLatitude() {
        return centerLatitude;
    }

    public void setCenterLatitude(double centerLatitude) {
        this.centerLatitude = centerLatitude;
    }

    public double getCenterLongitude() {
        return centerLongitude;
    }

    public void setCenterLongitude(double centerLongitude) {
        this.centerLongitude = centerLongitude;
    }

    public double getRadiusMeters() {
        return radiusMeters;
    }

    public void setRadiusMeters(double radiusMeters) {
        this.radiusMeters = radiusMeters;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}