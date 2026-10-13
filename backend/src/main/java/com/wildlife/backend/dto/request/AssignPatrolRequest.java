package com.wildlife.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AssignPatrolRequest {

    private String patrolReference;

    @NotBlank(message = "Ranger ID is required")
    private String rangerId;

    @NotBlank(message = "Route ID is required")
    private String routeId;

    public String getPatrolReference() {
        return patrolReference;
    }

    public void setPatrolReference(String patrolReference) {
        this.patrolReference = patrolReference;
    }

    public String getRangerId() {
        return rangerId;
    }

    public void setRangerId(String rangerId) {
        this.rangerId = rangerId;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }
}
