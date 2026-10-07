package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.service.interfaces.PatrolService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatrolServiceImpl implements PatrolService {

    private final PatrolRepository patrolRepository;

    public PatrolServiceImpl(PatrolRepository patrolRepository) {
        this.patrolRepository = patrolRepository;
    }

    @Override
    public List<Patrol> getAssignedPatrols(Long rangerId) {
        return patrolRepository.findByRanger_Id(rangerId);
    }

    @Override
    public Patrol getPatrolByReference(String patrolReference) {

        return patrolRepository.findByPatrolReference(patrolReference)
                .orElseThrow(() ->
                        new PatrolNotFoundException(patrolReference));
    }

    @Override
    public Patrol startPatrol(String patrolReference) {

        Patrol patrol = getPatrolByReference(patrolReference);

        if (patrol.getStatus() != PatrolStatus.ASSIGNED) {
            throw new InvalidPatrolStateException(
                    "Only an assigned patrol can be started."
            );
        }

        patrol.setStatus(PatrolStatus.IN_PROGRESS);
        patrol.setStartTime(LocalDateTime.now());

        return patrolRepository.save(patrol);
    }

    @Override
    public Patrol completePatrol(String patrolReference) {

        Patrol patrol = getPatrolByReference(patrolReference);

        if (patrol.getStatus() != PatrolStatus.IN_PROGRESS) {
            throw new InvalidPatrolStateException(
                    "Only an active patrol can be completed."
            );
        }

        patrol.setStatus(PatrolStatus.COMPLETED);
        patrol.setEndTime(LocalDateTime.now());

        return patrolRepository.save(patrol);
    }
}