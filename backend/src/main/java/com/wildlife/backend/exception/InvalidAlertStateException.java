package com.wildlife.backend.exception;

public class InvalidAlertStateException extends RuntimeException {

    public InvalidAlertStateException(String message) {
        super(message);
    }
}