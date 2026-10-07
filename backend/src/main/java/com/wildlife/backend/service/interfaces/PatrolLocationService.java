package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.PatrolLocation;

import java.util.List;

public interface PatrolLocationService {

    PatrolLocation recordLocation(
            String patrolReference,
            double latitude,
            double longitude
    );

    List<PatrolLocation> getPatrolLocations(
            String patrolReference
    );
}