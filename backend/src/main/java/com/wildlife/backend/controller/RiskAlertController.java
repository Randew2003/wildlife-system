package com.wildlife.backend.controller;

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
    public ResponseEntity<List<RiskAlert>> getAllAlerts() {
        return ResponseEntity.ok(
                riskAlertService.getAllAlerts()
        );
    }

    @GetMapping("/{alertId}")
    public ResponseEntity<RiskAlert> getAlert(
            @PathVariable String alertId) {

        return ResponseEntity.ok(
                riskAlertService.getAlert(alertId)
        );
    }

    @PutMapping("/{alertId}/accept")
    public ResponseEntity<RiskAlert> acceptAlert(
            @PathVariable String alertId) {

        return ResponseEntity.ok(
                riskAlertService.acceptAlert(alertId)
        );
    }

    @PutMapping("/{alertId}/respond")
    public ResponseEntity<RiskAlert> startResponse(
            @PathVariable String alertId) {

        return ResponseEntity.ok(
                riskAlertService.startResponse(alertId)
        );
    }

    @PutMapping("/{alertId}/resolve")
    public ResponseEntity<RiskAlert> resolveAlert(
            @PathVariable String alertId) {

        return ResponseEntity.ok(
                riskAlertService.resolveAlert(alertId)
        );
    }
}