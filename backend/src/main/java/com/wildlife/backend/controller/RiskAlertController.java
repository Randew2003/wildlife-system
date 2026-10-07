package com.wildlife.backend.controller;

import com.wildlife.backend.dto.response.RiskAlertResponse;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.service.interfaces.RiskAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class RiskAlertController {

    private final RiskAlertService riskAlertService;

    public RiskAlertController(RiskAlertService riskAlertService) {
        this.riskAlertService = riskAlertService;
    }

    @GetMapping
    public ResponseEntity<List<RiskAlertResponse>> getAllAlerts() {

        List<RiskAlertResponse> responses =
                riskAlertService.getAllAlerts()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{alertId}")
    public ResponseEntity<RiskAlertResponse> getAlert(
            @PathVariable String alertId) {

        RiskAlert alert = riskAlertService.getAlert(alertId);

        return ResponseEntity.ok(toResponse(alert));
    }

    @PutMapping("/{alertId}/accept")
    public ResponseEntity<RiskAlertResponse> acceptAlert(
            @PathVariable String alertId) {

        RiskAlert alert =
                riskAlertService.acceptAlert(alertId);

        return ResponseEntity.ok(toResponse(alert));
    }

    @PutMapping("/{alertId}/respond")
    public ResponseEntity<RiskAlertResponse> startResponse(
            @PathVariable String alertId) {

        RiskAlert alert =
                riskAlertService.startResponse(alertId);

        return ResponseEntity.ok(toResponse(alert));
    }

    @PutMapping("/{alertId}/resolve")
    public ResponseEntity<RiskAlertResponse> resolveAlert(
            @PathVariable String alertId) {

        RiskAlert alert =
                riskAlertService.resolveAlert(alertId);

        return ResponseEntity.ok(toResponse(alert));
    }

    private RiskAlertResponse toResponse(RiskAlert alert) {

        return new RiskAlertResponse(
                alert.getAlertId(),
                alert.getAnimal().getAnimalId(),
                alert.getAnimal().getName(),
                alert.getLocation().getId(),
                alert.getRiskZone().getId(),
                alert.getStatus(),
                alert.getDetectedAt()
        );
    }
}