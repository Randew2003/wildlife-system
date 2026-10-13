package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.GPSLocation;

import java.time.LocalDateTime;

public class GPSLocationResponse {

    private Long id;
    private String animalId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime recordedAt;

    public GPSLocationResponse() {
    }

    public GPSLocationResponse(
            Long id,
            double latitude,
            double longitude,
            LocalDateTime recordedAt,
            String animalId) {

        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.recordedAt = recordedAt;
        this.animalId = animalId;
    }

    public static GPSLocationResponse fromEntity(
            GPSLocation location) {

        return new GPSLocationResponse(
                location.getId(),
                location.getLatitude(),
                location.getLongitude(),
                location.getRecordedAt(),
                location.getAnimal().getAnimalId()
        );
    }

    public Long getId() {
        return id;
    }

    public String getAnimalId() {
        return animalId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
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

    public String getAnimalId() {
        return animalId;
    }
}
