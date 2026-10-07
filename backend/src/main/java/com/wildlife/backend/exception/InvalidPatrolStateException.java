package com.wildlife.backend.exception;

public class InvalidPatrolStateException extends RuntimeException {

    public InvalidPatrolStateException(String message) {
        super(message);
    }
}