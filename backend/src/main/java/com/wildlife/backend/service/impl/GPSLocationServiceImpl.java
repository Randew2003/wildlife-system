package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.repository.AnimalRepository;
import com.wildlife.backend.repository.GPSLocationRepository;
import com.wildlife.backend.service.interfaces.GPSLocationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class GPSLocationServiceImpl implements GPSLocationService {

    private final AnimalRepository animalRepository;
    private final GPSLocationRepository gpsLocationRepository;

    public GPSLocationServiceImpl(
            AnimalRepository animalRepository,
            GPSLocationRepository gpsLocationRepository) {

        this.animalRepository = animalRepository;
        this.gpsLocationRepository = gpsLocationRepository;
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

        return gpsLocationRepository.save(location);
    }
}