package com.wildlife.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(WildlifeIncidentNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleIncidentNotFound(
            WildlifeIncidentNotFoundException exception) {

        Map<String, String> response = new LinkedHashMap<>();
        response.put("error", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }



        @ExceptionHandler(PatrolNotFoundException.class)
public ResponseEntity<Map<String, String>> handlePatrolNotFound(
        PatrolNotFoundException exception) {

    Map<String, String> response = new LinkedHashMap<>();
    response.put("error", exception.getMessage());

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(response);
}









        @ExceptionHandler(InvalidPatrolStateException.class)
public ResponseEntity<Map<String, String>> handleInvalidPatrolState(
        InvalidPatrolStateException exception) {

    Map<String, String> response = new LinkedHashMap<>();
    response.put("error", exception.getMessage());

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response);
}








    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(
            IllegalArgumentException exception) {

        Map<String, String> response = new LinkedHashMap<>();
        response.put("error", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException exception) {

        Map<String, String> errors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errors);
    }

    @ExceptionHandler(InvalidAlertStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidAlertState(
                InvalidAlertStateException exception) {

        Map<String, String> response = new LinkedHashMap<>();
        response.put("error", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
        }
}