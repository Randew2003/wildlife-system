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

        return patrolRepository
                .findByPatrolReference(patrolReference)
                .orElseThrow(() ->
                        new PatrolNotFoundException(patrolReference));
    }

    @Override
    public Patrol startPatrol(String patrolReference) {

        Patrol patrol = getPatrolByReference(patrolReference);

        validatePatrolCanBeStarted(patrol);

        patrol.setStatus(PatrolStatus.IN_PROGRESS);
        patrol.setStartTime(LocalDateTime.now());

        patrolRepository.save(patrol);

        return getPatrolByReference(patrolReference);
    }

    @Override
    public Patrol completePatrol(String patrolReference) {

        Patrol patrol = getPatrolByReference(patrolReference);

        validatePatrolCanBeCompleted(patrol);

        patrol.setStatus(PatrolStatus.COMPLETED);
        patrol.setEndTime(LocalDateTime.now());

        patrolRepository.save(patrol);

        return getPatrolByReference(patrolReference);
    }

    private void validatePatrolCanBeStarted(Patrol patrol) {

        if (patrol.getStatus() != PatrolStatus.ASSIGNED) {
            throw new InvalidPatrolStateException(
                    "Only an assigned patrol can be started."
            );
        }
    }

    private void validatePatrolCanBeCompleted(Patrol patrol) {

        if (patrol.getStatus() != PatrolStatus.IN_PROGRESS) {
            throw new InvalidPatrolStateException(
                    "Only an active patrol can be completed."
            );
        }
    }
}