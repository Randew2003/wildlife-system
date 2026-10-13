package com.wildlife.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreatePatrolRouteRequest {

    @NotBlank(message = "Route ID is required")
    private String routeId;

    @NotBlank(message = "Route name is required")
    private String routeName;

    private String description;

    @NotNull(message = "Start latitude is required")
    @DecimalMin(value = "-90.0", message = "Start latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Start latitude must be between -90 and 90")
    private Double startLatitude;

    @NotNull(message = "Start longitude is required")
    @DecimalMin(value = "-180.0", message = "Start longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Start longitude must be between -180 and 180")
    private Double startLongitude;

    @NotNull(message = "End latitude is required")
    @DecimalMin(value = "-90.0", message = "End latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "End latitude must be between -90 and 90")
    private Double endLatitude;

    @NotNull(message = "End longitude is required")
    @DecimalMin(value = "-180.0", message = "End longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "End longitude must be between -180 and 180")
    private Double endLongitude;

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(Double startLatitude) {
        this.startLatitude = startLatitude;
    }

    public Double getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(Double startLongitude) {
        this.startLongitude = startLongitude;
    }

    public Double getEndLatitude() {
        return endLatitude;
    }

    public void setEndLatitude(Double endLatitude) {
        this.endLatitude = endLatitude;
    }

    public Double getEndLongitude() {
        return endLongitude;
    }

    public void setEndLongitude(Double endLongitude) {
        this.endLongitude = endLongitude;
    }
}
