package com.wildlife.backend.repository;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatrolRepository extends JpaRepository<Patrol, Long> {

    @EntityGraph(attributePaths = {"ranger", "route"})
    Optional<Patrol> findByPatrolReference(String patrolReference);

    @EntityGraph(attributePaths = {"ranger", "route"})
    List<Patrol> findByRanger_Id(Long rangerId);

    List<Patrol> findByStatus(PatrolStatus status);
}