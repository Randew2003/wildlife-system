package com.wildlife.backend.repository;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatrolRepository extends JpaRepository<Patrol, Long> {

    Optional<Patrol> findByPatrolReference(String patrolReference);

    List<Patrol> findByRanger_Id(Long rangerId);

    List<Patrol> findByStatus(PatrolStatus status);
}