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
            String animalId,
            Double latitude,
            Double longitude,
            LocalDateTime recordedAt) {

        this.id = id;
        this.animalId = animalId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.recordedAt = recordedAt;
    }

    public static GPSLocationResponse fromEntity(GPSLocation location) {

        return new GPSLocationResponse(
                location.getId(),
                location.getAnimal().getAnimalId(),
                location.getLatitude(),
                location.getLongitude(),
                location.getRecordedAt()
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
        return longitude;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }
}
