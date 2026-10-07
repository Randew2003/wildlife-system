package com.wildlife.backend.exception;

public class PatrolNotFoundException extends RuntimeException {

    public PatrolNotFoundException(String patrolReference) {
        super("Patrol not found: " + patrolReference);
    }
}