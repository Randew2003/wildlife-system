package com.wildlife.backend.repository;

import com.wildlife.backend.entity.PatrolLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatrolLocationRepository
        extends JpaRepository<PatrolLocation, Long> {

    List<PatrolLocation> findByPatrolIdOrderByRecordedAtAsc(Long patrolId);
}