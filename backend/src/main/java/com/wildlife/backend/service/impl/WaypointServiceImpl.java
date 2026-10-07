package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.entity.Waypoint;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.repository.WaypointRepository;
import com.wildlife.backend.service.interfaces.WaypointService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WaypointServiceImpl implements WaypointService {

    private final PatrolRepository patrolRepository;
    private final WaypointRepository waypointRepository;

    public WaypointServiceImpl(
            PatrolRepository patrolRepository,
            WaypointRepository waypointRepository) {

        this.patrolRepository = patrolRepository;
        this.waypointRepository = waypointRepository;
    }

    @Override
    public Waypoint addWaypoint(
            String patrolReference,
            double latitude,
            double longitude,
            String note) {

        Patrol patrol = findPatrol(patrolReference);

        validateActivePatrol(patrol);
        validateCoordinates(latitude, longitude);

        Waypoint waypoint = new Waypoint(
                latitude,
                longitude,
                note,
                LocalDateTime.now(),
                patrol
        );

        return waypointRepository.save(waypoint);
    }

    @Override
    public List<Waypoint> getPatrolWaypoints(
            String patrolReference) {

        Patrol patrol = findPatrol(patrolReference);

        return waypointRepository
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
                    "A waypoint can only be added to an active patrol."
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