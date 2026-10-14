package com.wildlife.backend.exception;

public class InvalidConflictReportStateException extends RuntimeException {

    public InvalidConflictReportStateException(String message) {
        super(message);
    }
}