package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.Waypoint;

import java.util.List;

public interface WaypointService {

    Waypoint addWaypoint(
            String patrolReference,
            double latitude,
            double longitude,
            String note
    );

    List<Waypoint> getPatrolWaypoints(
            String patrolReference
    );
}