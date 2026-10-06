package com.wildlife.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_alerts")
public class RiskAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String alertId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private GPSLocation location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_zone_id", nullable = false)
    private RiskZone riskZone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    public RiskAlert() {
    }

    public RiskAlert(
            String alertId,
            Animal animal,
            GPSLocation location,
            RiskZone riskZone,
            AlertStatus status,
            LocalDateTime detectedAt) {

        this.alertId = alertId;
        this.animal = animal;
        this.location = location;
        this.riskZone = riskZone;
        this.status = status;
        this.detectedAt = detectedAt;
    }

    public Long getId() {
        return id;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public Animal getAnimal() {
        return animal;
    }

    public void setAnimal(Animal animal) {
        this.animal = animal;
    }

    public GPSLocation getLocation() {
        return location;
    }

    public void setLocation(GPSLocation location) {
        this.location = location;
    }

    public RiskZone getRiskZone() {
        return riskZone;
    }

    public void setRiskZone(RiskZone riskZone) {
        this.riskZone = riskZone;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public void setStatus(AlertStatus status) {
        this.status = status;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }
}