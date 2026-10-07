package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.Patrol;

import java.util.List;

public interface PatrolService {

    List<Patrol> getAssignedPatrols(Long rangerId);

    Patrol getPatrolByReference(String patrolReference);

    Patrol startPatrol(String patrolReference);

    Patrol completePatrol(String patrolReference);
}