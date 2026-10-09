package com.wildlife.backend.service;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.entity.Waypoint;
import com.wildlife.backend.exception.InvalidPatrolStateException;
import com.wildlife.backend.exception.PatrolNotFoundException;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.repository.WaypointRepository;
import com.wildlife.backend.service.impl.WaypointServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaypointServiceImplTest {

    @Mock
    private PatrolRepository patrolRepository;

    @Mock
    private WaypointRepository waypointRepository;

    private WaypointServiceImpl waypointService;

    private Patrol patrol;

    @BeforeEach
    void setUp() {

        waypointService =
                new WaypointServiceImpl(
                        patrolRepository,
                        waypointRepository
                );

        patrol = new Patrol();

        patrol.setPatrolReference("PAT-001");
        patrol.setStatus(PatrolStatus.IN_PROGRESS);
    }

    @Test
    void addWaypoint_shouldSaveWaypointForActivePatrol() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        Waypoint savedWaypoint = new Waypoint(
                6.9271,
                79.8612,
                "Elephant sighting",
                LocalDateTime.now(),
                patrol
        );

        when(waypointRepository.save(any(Waypoint.class)))
                .thenReturn(savedWaypoint);

        Waypoint result =
                waypointService.addWaypoint(
                        "PAT-001",
                        6.9271,
                        79.8612,
                        "Elephant sighting"
                );

        assertNotNull(result);

        verify(patrolRepository)
                .findByPatrolReference("PAT-001");

        verify(waypointRepository)
                .save(any(Waypoint.class));
    }

    @Test
    void addWaypoint_shouldRejectNonActivePatrol() {

        patrol.setStatus(PatrolStatus.ASSIGNED);

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                InvalidPatrolStateException.class,
                () -> waypointService.addWaypoint(
                        "PAT-001",
                        6.9271,
                        79.8612,
                        "Test waypoint"
                )
        );

        verify(waypointRepository, never())
                .save(any(Waypoint.class));
    }

    @Test
    void addWaypoint_shouldRejectInvalidLatitude() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                IllegalArgumentException.class,
                () -> waypointService.addWaypoint(
                        "PAT-001",
                        100.0,
                        79.8612,
                        "Invalid latitude"
                )
        );

        verify(waypointRepository, never())
                .save(any(Waypoint.class));
    }

    @Test
    void addWaypoint_shouldRejectInvalidLongitude() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        assertThrows(
                IllegalArgumentException.class,
                () -> waypointService.addWaypoint(
                        "PAT-001",
                        6.9271,
                        200.0,
                        "Invalid longitude"
                )
        );

        verify(waypointRepository, never())
                .save(any(Waypoint.class));
    }

    @Test
    void addWaypoint_shouldRejectMissingPatrol() {

        when(patrolRepository.findByPatrolReference("PAT-999"))
                .thenReturn(Optional.empty());

        assertThrows(
                PatrolNotFoundException.class,
                () -> waypointService.addWaypoint(
                        "PAT-999",
                        6.9271,
                        79.8612,
                        "Test waypoint"
                )
        );

        verify(waypointRepository, never())
                .save(any(Waypoint.class));
    }

    @Test
    void addWaypoint_shouldStoreCorrectWaypointData() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        when(waypointRepository.save(any(Waypoint.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        waypointService.addWaypoint(
                "PAT-001",
                6.9271,
                79.8612,
                "Water source"
        );

        ArgumentCaptor<Waypoint> captor =
                ArgumentCaptor.forClass(Waypoint.class);

        verify(waypointRepository)
                .save(captor.capture());

        Waypoint savedWaypoint = captor.getValue();

        assertEquals(
                6.9271,
                savedWaypoint.getLatitude()
        );

        assertEquals(
                79.8612,
                savedWaypoint.getLongitude()
        );

        assertEquals(
                "Water source",
                savedWaypoint.getNote()
        );

        assertEquals(
                patrol,
                savedWaypoint.getPatrol()
        );

        assertNotNull(
                savedWaypoint.getRecordedAt()
        );
    }

    @Test
    void getPatrolWaypoints_shouldReturnWaypoints() {

        when(patrolRepository.findByPatrolReference("PAT-001"))
                .thenReturn(Optional.of(patrol));

        Waypoint waypoint1 = new Waypoint(
                6.9271,
                79.8612,
                "First waypoint",
                LocalDateTime.now().minusMinutes(5),
                patrol
        );

        Waypoint waypoint2 = new Waypoint(
                6.9280,
                79.8620,
                "Second waypoint",
                LocalDateTime.now(),
                patrol
        );

        when(waypointRepository
                .findByPatrolIdOrderByRecordedAtAsc(any()))
                .thenReturn(List.of(
                        waypoint1,
                        waypoint2
                ));

        List<Waypoint> result =
                waypointService.getPatrolWaypoints("PAT-001");

        assertNotNull(result);

        assertEquals(
                2,
                result.size()
        );

        assertEquals(
                waypoint1,
                result.get(0)
        );

        assertEquals(
                waypoint2,
                result.get(1)
        );

        verify(waypointRepository)
                .findByPatrolIdOrderByRecordedAtAsc(any());
    }

    @Test
    void getPatrolWaypoints_shouldRejectMissingPatrol() {

        when(patrolRepository.findByPatrolReference("PAT-999"))
                .thenReturn(Optional.empty());

        assertThrows(
                PatrolNotFoundException.class,
                () -> waypointService
                        .getPatrolWaypoints("PAT-999")
        );

        verify(waypointRepository, never())
                .findByPatrolIdOrderByRecordedAtAsc(any());
    }
}