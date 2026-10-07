package com.wildlife.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class RecordLocationRequest {

    @NotNull(message = "Latitude is required")
    @DecimalMin(
            value = "-90.0",
            message = "Latitude must be between -90 and 90"
    )
    @DecimalMax(
            value = "90.0",
            message = "Latitude must be between -90 and 90"
    )
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(
            value = "-180.0",
            message = "Longitude must be between -180 and 180"
    )
    @DecimalMax(
            value = "180.0",
            message = "Longitude must be between -180 and 180"
    )
    private Double longitude;

    public RecordLocationRequest() {
    }

    public RecordLocationRequest(
            Double latitude,
            Double longitude) {

        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}