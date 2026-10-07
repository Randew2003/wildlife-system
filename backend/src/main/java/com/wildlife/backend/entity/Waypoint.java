package com.wildlife.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "patrol_waypoints")
public class Waypoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column
    private String note;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patrol_id", nullable = false)
    private Patrol patrol;

    public Waypoint() {
    }

    public Waypoint(
            double latitude,
            double longitude,
            String note,
            LocalDateTime recordedAt,
            Patrol patrol) {

        this.latitude = latitude;
        this.longitude = longitude;
        this.note = note;
        this.recordedAt = recordedAt;
        this.patrol = patrol;
    }

    public Long getId() {
        return id;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public Patrol getPatrol() {
        return patrol;
    }

    public void setPatrol(Patrol patrol) {
        this.patrol = patrol;
    }
}