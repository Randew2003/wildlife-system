package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.AnimalRepository;
import com.wildlife.backend.repository.GPSLocationRepository;
import com.wildlife.backend.service.interfaces.GPSLocationService;
import com.wildlife.backend.service.interfaces.RiskAlertService;
import com.wildlife.backend.service.interfaces.RiskZoneService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class GPSLocationServiceImpl implements GPSLocationService {

    private final AnimalRepository animalRepository;
    private final GPSLocationRepository gpsLocationRepository;
    private final RiskZoneService riskZoneService;
    private final RiskAlertService riskAlertService;

    public GPSLocationServiceImpl(
            AnimalRepository animalRepository,
            GPSLocationRepository gpsLocationRepository,
            RiskZoneService riskZoneService,
            RiskAlertService riskAlertService) {

        this.animalRepository = animalRepository;
        this.gpsLocationRepository = gpsLocationRepository;
        this.riskZoneService = riskZoneService;
        this.riskAlertService = riskAlertService;
    }

    @Override
    public GPSLocation processLocation(
            String animalId,
            double latitude,
            double longitude,
            LocalDateTime recordedAt) {

        Animal animal = animalRepository.findByAnimalId(animalId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Animal not found: " + animalId
                        ));

        if (!animal.isCollarActive()) {
            throw new IllegalStateException(
                    "GPS collar is not active for animal: " + animalId
            );
        }

        GPSLocation location = new GPSLocation(
                latitude,
                longitude,
                recordedAt,
                animal
        );

        GPSLocation savedLocation =
                gpsLocationRepository.save(location);

        Optional<RiskZone> containingZone =
                riskZoneService.findContainingZone(savedLocation);

        if (containingZone.isPresent()) {

            RiskAlert alert = riskAlertService.createAlert(
                    savedLocation,
                    containingZone.get()
            );

            System.out.println(
                    "High-risk movement detected. Alert created: "
                            + alert.getAlertId()
            );
        }

        return savedLocation;
    }
}