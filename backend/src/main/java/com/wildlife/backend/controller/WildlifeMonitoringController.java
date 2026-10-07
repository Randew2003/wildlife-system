package com.wildlife.backend.controller;

import com.wildlife.backend.dto.GPSLocationRequest;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.service.interfaces.GPSLocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/animals")
public class WildlifeMonitoringController {

    private final GPSLocationService gpsLocationService;

    public WildlifeMonitoringController(
            GPSLocationService gpsLocationService) {

        this.gpsLocationService = gpsLocationService;
    }

    @PostMapping("/{animalId}/location")
    public ResponseEntity<GPSLocation> receiveLocation(
            @PathVariable String animalId,
            @RequestBody GPSLocationRequest request) {

        GPSLocation location =
                gpsLocationService.processLocation(
                        animalId,
                        request.getLatitude(),
                        request.getLongitude(),
                        request.getRecordedAt()
                );

        return ResponseEntity.ok(location);
    }
}