package com.wildlife.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public class StartPatrolRequest {

    @NotBlank(message = "Patrol reference is required")
    private String patrolReference;

    public StartPatrolRequest() {
    }

    public StartPatrolRequest(String patrolReference) {
        this.patrolReference = patrolReference;
    }

    public String getPatrolReference() {
        return patrolReference;
    }

    public void setPatrolReference(String patrolReference) {
        this.patrolReference = patrolReference;
    }
}