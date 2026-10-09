package com.wildlife.backend.service;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolLocation;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolLocationRepository;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.service.impl.PatrolLocationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatrolLocationServiceImplTest {

    @Mock
    private PatrolRepository patrolRepository;

    @Mock
    private PatrolLocationRepository patrolLocationRepository;

    private PatrolLocationServiceImpl patrolLocationService;

    private Patrol patrol;

    @BeforeEach
    void setUp() {

        patrolLocationService =
                new PatrolLocationServiceImpl(
                        patrolRepository,
                        patrolLocationRepository
                );

        patrol = new Patrol();
        patrol.setPatrolReference("PAT-001");
        patrol.setStatus(PatrolStatus.IN_PROGRESS);
    }

    @Test
    void recordLocation_shouldSaveLocationForActivePatrol() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        PatrolLocation savedLocation = new PatrolLocation(
                6.9271,
                79.8612,
                java.time.LocalDateTime.now(),
                patrol
        );

        when(patrolLocationRepository.save(any(PatrolLocation.class)))
                .thenReturn(savedLocation);

        PatrolLocation result =
                patrolLocationService.recordLocation(
                        "PAT-001",
                        6.9271,
                        79.8612
                );

        assertNotNull(result);

        verify(patrolRepository)
                .findByPatrolReference("PAT-001");

        verify(patrolLocationRepository)
                .save(any(PatrolLocation.class));
    }

    @Test
    void recordLocation_shouldRejectNonActivePatrol() {

        patrol.setStatus(PatrolStatus.ASSIGNED);

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                InvalidPatrolStateException.class,
                () -> patrolLocationService.recordLocation(
                        "PAT-001",
                        6.9271,
                        79.8612
                )
        );

        verify(patrolLocationRepository, never())
                .save(any(PatrolLocation.class));
    }

    @Test
    void recordLocation_shouldRejectInvalidLatitude() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                IllegalArgumentException.class,
                () -> patrolLocationService.recordLocation(
                        "PAT-001",
                        100.0,
                        79.8612
                )
        );

        verify(patrolLocationRepository, never())
                .save(any(PatrolLocation.class));
    }

    @Test
    void recordLocation_shouldRejectInvalidLongitude() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                IllegalArgumentException.class,
                () -> patrolLocationService.recordLocation(
                        "PAT-001",
                        6.9271,
                        200.0
                )
        );

        verify(patrolLocationRepository, never())
                .save(any(PatrolLocation.class));
    }

    @Test
    void recordLocation_shouldRejectMissingPatrol() {

        when(patrolRepository.findByPatrolReference("PAT-999"))
                .thenReturn(Optional.empty());

        assertThrows(
                PatrolNotFoundException.class,
                () -> patrolLocationService.recordLocation(
                        "PAT-999",
                        6.9271,
                        79.8612
                )
        );

        verify(patrolLocationRepository, never())
                .save(any(PatrolLocation.class));
    }

    @Test
    void recordLocation_shouldStoreCorrectCoordinates() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        when(patrolLocationRepository.save(any(PatrolLocation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        patrolLocationService.recordLocation(
                "PAT-001",
                6.9271,
                79.8612
        );

        ArgumentCaptor<PatrolLocation> captor =
                ArgumentCaptor.forClass(PatrolLocation.class);

        verify(patrolLocationRepository).save(captor.capture());

        PatrolLocation savedLocation = captor.getValue();

        assertEquals(6.9271, savedLocation.getLatitude());
        assertEquals(79.8612, savedLocation.getLongitude());
        assertEquals(patrol, savedLocation.getPatrol());
        assertNotNull(savedLocation.getRecordedAt());
    }

    @Test
    void getPatrolLocations_shouldReturnLocationsInOrder() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        PatrolLocation location1 = new PatrolLocation(
                6.9271,
                79.8612,
                java.time.LocalDateTime.now().minusMinutes(5),
                patrol
        );

        PatrolLocation location2 = new PatrolLocation(
                6.9280,
                79.8620,
                java.time.LocalDateTime.now(),
                patrol
        );

        when(patrolLocationRepository
                .findByPatrolIdOrderByRecordedAtAsc(any()))
                .thenReturn(List.of(location1, location2));

        List<PatrolLocation> result =
                patrolLocationService.getPatrolLocations("PAT-001");

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(location1, result.get(0));
        assertEquals(location2, result.get(1));

        verify(patrolLocationRepository)
                .findByPatrolIdOrderByRecordedAtAsc(any());
    }

    @Test
    void getPatrolLocations_shouldRejectMissingPatrol() {

        when(patrolRepository.findByPatrolReference("PAT-999"))
                .thenReturn(Optional.empty());

        assertThrows(
                PatrolNotFoundException.class,
                () -> patrolLocationService
                        .getPatrolLocations("PAT-999")
        );

        verify(patrolLocationRepository, never())
                .findByPatrolIdOrderByRecordedAtAsc(any());
    }
}