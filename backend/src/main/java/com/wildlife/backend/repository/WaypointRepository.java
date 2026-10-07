package com.wildlife.backend.repository;

import com.wildlife.backend.entity.Waypoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaypointRepository
        extends JpaRepository<Waypoint, Long> {

    List<Waypoint> findByPatrolIdOrderByRecordedAtAsc(Long patrolId);
}