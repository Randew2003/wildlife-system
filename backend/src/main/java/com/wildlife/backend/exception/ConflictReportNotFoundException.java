package com.wildlife.backend.exception;

public class ConflictReportNotFoundException extends RuntimeException {

    public ConflictReportNotFoundException(String message) {
        super(message);
    }
}