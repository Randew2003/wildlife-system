package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.Waypoint;

import java.time.LocalDateTime;

public class WaypointResponse {

    private Long id;
    private double latitude;
    private double longitude;
    private String note;
    private LocalDateTime recordedAt;

    public WaypointResponse() {
    }

    public WaypointResponse(
            Long id,
            double latitude,
            double longitude,
            String note,
            LocalDateTime recordedAt) {

        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.note = note;
        this.recordedAt = recordedAt;
    }

    public static WaypointResponse fromEntity(
            Waypoint waypoint) {

        return new WaypointResponse(
                waypoint.getId(),
                waypoint.getLatitude(),
                waypoint.getLongitude(),
                waypoint.getNote(),
                waypoint.getRecordedAt()
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

    public String getNote() {
        return note;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }
}