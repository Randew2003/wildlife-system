package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolLocation;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolLocationRepository;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.service.interfaces.PatrolLocationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatrolLocationServiceImpl implements PatrolLocationService {

    private final PatrolRepository patrolRepository;
    private final PatrolLocationRepository patrolLocationRepository;

    public PatrolLocationServiceImpl(
            PatrolRepository patrolRepository,
            PatrolLocationRepository patrolLocationRepository) {

        this.patrolRepository = patrolRepository;
        this.patrolLocationRepository = patrolLocationRepository;
    }

    @Override
    public PatrolLocation recordLocation(
            String patrolReference,
            double latitude,
            double longitude) {

        Patrol patrol = findPatrol(patrolReference);

        validateActivePatrol(patrol);
        validateCoordinates(latitude, longitude);

        PatrolLocation location = new PatrolLocation(
                latitude,
                longitude,
                LocalDateTime.now(),
                patrol
        );

        return patrolLocationRepository.save(location);
    }

    @Override
    public List<PatrolLocation> getPatrolLocations(
            String patrolReference) {

        Patrol patrol = findPatrol(patrolReference);

        return patrolLocationRepository
                .findByPatrolIdOrderByRecordedAtAsc(patrol.getId());
    }

    private Patrol findPatrol(String patrolReference) {

        return patrolRepository
                .findByPatrolReference(patrolReference)
                .orElseThrow(() ->
                        new PatrolNotFoundException(patrolReference));
    }

    private void validateActivePatrol(Patrol patrol) {

        if (patrol.getStatus() != PatrolStatus.IN_PROGRESS) {
            throw new InvalidPatrolStateException(
                    "Location can only be recorded for an active patrol."
            );
        }
    }

    private void validateCoordinates(
            double latitude,
            double longitude) {

        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90."
            );
        }

        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180."
            );
        }
    }
}