package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.GPSLocationRequest;
import com.wildlife.backend.dto.response.GPSLocationResponse;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.repository.GPSLocationRepository;
import com.wildlife.backend.service.interfaces.GPSLocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/animals")
public class WildlifeMonitoringController {

    private final GPSLocationService gpsLocationService;
    private final GPSLocationRepository gpsLocationRepository;

    public WildlifeMonitoringController(
            GPSLocationService gpsLocationService,
            GPSLocationRepository gpsLocationRepository) {

        this.gpsLocationService = gpsLocationService;
        this.gpsLocationRepository = gpsLocationRepository;
    }

    @PostMapping("/{animalId}/location")
    public ResponseEntity<GPSLocationResponse> receiveLocation(
            @PathVariable String animalId,
            @RequestBody @Valid GPSLocationRequest request) {

        GPSLocation location =
                gpsLocationService.processLocation(
                        animalId,
                        request.getLatitude(),
                        request.getLongitude(),
                        request.getRecordedAt()
                );

        return ResponseEntity.ok(
                GPSLocationResponse.fromEntity(location)
        );
    }

    @GetMapping("/{animalId}/locations")
    public ResponseEntity<List<GPSLocationResponse>> getLocations(
            @PathVariable String animalId) {

        List<GPSLocationResponse> response =
                gpsLocationRepository
                        .findByAnimalAnimalIdOrderByRecordedAtDesc(animalId)
                        .stream()
                        .map(GPSLocationResponse::fromEntity)
                        .toList();

        return ResponseEntity.ok(response);
    }
}
