package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.PatrolLocation;

import java.time.LocalDateTime;

public class PatrolLocationResponse {

    private Long id;
    private double latitude;
    private double longitude;
    private LocalDateTime recordedAt;

    public PatrolLocationResponse() {
    }

    public PatrolLocationResponse(
            Long id,
            double latitude,
            double longitude,
            LocalDateTime recordedAt) {

        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.recordedAt = recordedAt;
    }

    public static PatrolLocationResponse fromEntity(
            PatrolLocation location) {

        return new PatrolLocationResponse(
                location.getId(),
                location.getLatitude(),
                location.getLongitude(),
                location.getRecordedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }
}