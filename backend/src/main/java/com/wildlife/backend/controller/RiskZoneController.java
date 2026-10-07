package com.wildlife.backend.controller;

import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.service.interfaces.RiskZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risk-zones")
public class RiskZoneController {

    private final RiskZoneService riskZoneService;

    public RiskZoneController(RiskZoneService riskZoneService) {
        this.riskZoneService = riskZoneService;
    }

    @PostMapping
    public ResponseEntity<RiskZone> createRiskZone(
            @RequestBody RiskZone riskZone) {

        return ResponseEntity.ok(
                riskZoneService.createRiskZone(riskZone)
        );
    }

    @GetMapping
    public ResponseEntity<List<RiskZone>> getAllRiskZones() {

        return ResponseEntity.ok(
                riskZoneService.getAllRiskZones()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskZone> getRiskZone(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                riskZoneService.getRiskZone(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<RiskZone> updateRiskZone(
            @PathVariable Long id,
            @RequestBody RiskZone riskZone) {

        return ResponseEntity.ok(
                riskZoneService.updateRiskZone(
                        id,
                        riskZone
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRiskZone(
            @PathVariable Long id) {

        riskZoneService.deleteRiskZone(id);

        return ResponseEntity.noContent().build();
    }
}