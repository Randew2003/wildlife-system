package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.GPSLocation;

import java.time.LocalDateTime;

public interface GPSLocationService {

    GPSLocation processLocation(
            String animalId,
            double latitude,
            double longitude,
            LocalDateTime recordedAt
    );
}