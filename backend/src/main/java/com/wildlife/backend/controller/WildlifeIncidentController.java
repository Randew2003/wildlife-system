package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.WildlifeIncidentRequest;
import com.wildlife.backend.dto.response.WildlifeIncidentResponse;
import com.wildlife.backend.service.interfaces.WildlifeIncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class WildlifeIncidentController {

    private final WildlifeIncidentService wildlifeIncidentService;

    @PostMapping
    public ResponseEntity<WildlifeIncidentResponse> createIncident(
            @Valid @RequestBody WildlifeIncidentRequest request) {

        WildlifeIncidentResponse response =
                wildlifeIncidentService.createIncident(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WildlifeIncidentResponse> getIncidentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                wildlifeIncidentService.getIncidentById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<WildlifeIncidentResponse>> getAllIncidents() {

        return ResponseEntity.ok(
                wildlifeIncidentService.getAllIncidents()
        );
    }

    @PostMapping("/{id}/retry-sync")
    public ResponseEntity<WildlifeIncidentResponse> retrySync(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                wildlifeIncidentService.retrySync(id)
        );
    }
}