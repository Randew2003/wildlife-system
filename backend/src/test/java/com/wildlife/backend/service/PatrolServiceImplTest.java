package com.wildlife.backend.service;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.service.impl.PatrolServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatrolServiceImplTest {

    @Mock
    private PatrolRepository patrolRepository;

    @InjectMocks
    private PatrolServiceImpl patrolService;

    private Patrol patrol;

    @BeforeEach
    void setUp() {

        patrol = new Patrol();

        patrol.setPatrolReference("PAT-001");
        patrol.setStatus(PatrolStatus.ASSIGNED);
    }

    @Test
    void getAssignedPatrols_shouldReturnPatrolList() {

        Long rangerId = 1L;

        when(patrolRepository.findByRanger_Id(rangerId))
                .thenReturn(List.of(patrol));

        List<Patrol> result =
                patrolService.getAssignedPatrols(rangerId);

        assertEquals(1, result.size());
        assertEquals(
                "PAT-001",
                result.get(0).getPatrolReference()
        );

        verify(patrolRepository)
                .findByRanger_Id(rangerId);
    }

    @Test
    void getPatrolByReference_shouldReturnPatrol() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        Patrol result =
                patrolService.getPatrolByReference("PAT-001");

        assertNotNull(result);
        assertEquals(
                "PAT-001",
                result.getPatrolReference()
        );

        verify(patrolRepository)
                .findByPatrolReference("PAT-001");
    }

    @Test
    void getPatrolByReference_shouldThrowExceptionWhenNotFound() {

        when(patrolRepository.findByPatrolReference("PAT-999"))
                .thenReturn(Optional.empty());

        assertThrows(
                PatrolNotFoundException.class,
                () -> patrolService.getPatrolByReference("PAT-999")
        );

        verify(patrolRepository)
                .findByPatrolReference("PAT-999");
    }

    @Test
    void startPatrol_shouldChangeStatusToInProgress() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        when(patrolRepository.save(patrol))
                .thenReturn(patrol);

        Patrol result =
                patrolService.startPatrol("PAT-001");

        assertEquals(
                PatrolStatus.IN_PROGRESS,
                result.getStatus()
        );

        assertNotNull(result.getStartTime());

        verify(patrolRepository)
                .save(patrol);

        verify(patrolRepository, times(2))
                .findByPatrolReference("PAT-001");
    }

    @Test
    void startPatrol_shouldThrowExceptionWhenPatrolIsNotAssigned() {

        patrol.setStatus(PatrolStatus.IN_PROGRESS);

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                InvalidPatrolStateException.class,
                () -> patrolService.startPatrol("PAT-001")
        );

        verify(patrolRepository, never())
                .save(any(Patrol.class));
    }

    @Test
    void completePatrol_shouldChangeStatusToCompleted() {

        patrol.setStatus(PatrolStatus.IN_PROGRESS);

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        when(patrolRepository.save(patrol))
                .thenReturn(patrol);

        Patrol result =
                patrolService.completePatrol("PAT-001");

        assertEquals(
                PatrolStatus.COMPLETED,
                result.getStatus()
        );

        assertNotNull(result.getEndTime());

        verify(patrolRepository)
                .save(patrol);

        verify(patrolRepository, times(2))
                .findByPatrolReference("PAT-001");
    }

    @Test
    void completePatrol_shouldThrowExceptionWhenPatrolIsNotInProgress() {

        patrol.setStatus(PatrolStatus.COMPLETED);

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                InvalidPatrolStateException.class,
                () -> patrolService.completePatrol("PAT-001")
        );

        verify(patrolRepository, never())
                .save(any(Patrol.class));
    }
}