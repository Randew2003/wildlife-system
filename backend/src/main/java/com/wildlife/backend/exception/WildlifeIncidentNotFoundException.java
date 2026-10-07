package com.wildlife.backend.exception;

public class WildlifeIncidentNotFoundException extends RuntimeException {

    public WildlifeIncidentNotFoundException(Long id) {
        super("Wildlife incident not found with id: " + id);
    }
}