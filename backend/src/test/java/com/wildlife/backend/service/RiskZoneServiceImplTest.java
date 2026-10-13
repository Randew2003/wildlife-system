package com.wildlife.backend.service;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.RiskZoneRepository;
import com.wildlife.backend.service.impl.RiskZoneServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskZoneServiceImplTest {

    @Mock
    private RiskZoneRepository riskZoneRepository;

    private RiskZoneServiceImpl riskZoneService;

    @BeforeEach
    void setUp() {
        riskZoneService =
                new RiskZoneServiceImpl(riskZoneRepository);
    }

    @Test
    void shouldCreateRiskZoneSuccessfully() {

        RiskZone riskZone = new RiskZone(
                "Test Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        when(riskZoneRepository.save(any(RiskZone.class)))
                .thenReturn(riskZone);

        RiskZone result =
                riskZoneService.createRiskZone(riskZone);

        assertNotNull(result);
        assertEquals(
                "Test Risk Zone",
                result.getZoneName()
        );
        assertEquals(
                6.9271,
                result.getCenterLatitude()
        );
        assertEquals(
                79.8612,
                result.getCenterLongitude()
        );
        assertEquals(
                500,
                result.getRadiusMeters()
        );
        assertTrue(result.isActive());

        verify(riskZoneRepository, times(1))
                .save(riskZone);
    }

    @Test
    void shouldGetAllRiskZonesSuccessfully() {

        RiskZone zone1 = new RiskZone(
                "Zone One",
                6.9271,
                79.8612,
                500,
                true
        );

        RiskZone zone2 = new RiskZone(
                "Zone Two",
                6.1395,
                80.1460,
                300,
                true
        );

        when(riskZoneRepository.findAll())
                .thenReturn(List.of(zone1, zone2));

        List<RiskZone> result =
                riskZoneService.getAllRiskZones();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(
                "Zone One",
                result.get(0).getZoneName()
        );
        assertEquals(
                "Zone Two",
                result.get(1).getZoneName()
        );

        verify(riskZoneRepository, times(1))
                .findAll();
    }

    @Test
    void shouldGetRiskZoneSuccessfully() {

        RiskZone riskZone = new RiskZone(
                "Test Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        when(riskZoneRepository.findById(1L))
                .thenReturn(Optional.of(riskZone));

        RiskZone result =
                riskZoneService.getRiskZone(1L);

        assertNotNull(result);
        assertEquals(
                "Test Risk Zone",
                result.getZoneName()
        );

        verify(riskZoneRepository, times(1))
                .findById(1L);
    }

    @Test
    void shouldThrowExceptionWhenRiskZoneNotFound() {

        when(riskZoneRepository.findById(99999L))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> riskZoneService.getRiskZone(99999L)
                );

        assertEquals(
                "Risk zone not found: 99999",
                exception.getMessage()
        );

        verify(riskZoneRepository, times(1))
                .findById(99999L);
    }

    @Test
    void shouldUpdateRiskZoneSuccessfully() {

        RiskZone existingZone = new RiskZone(
                "Old Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        RiskZone updatedZone = new RiskZone(
                "Updated Zone",
                6.9500,
                79.9000,
                1000,
                false
        );

        when(riskZoneRepository.findById(1L))
                .thenReturn(Optional.of(existingZone));

        when(riskZoneRepository.save(any(RiskZone.class)))
                .thenReturn(existingZone);

        RiskZone result =
                riskZoneService.updateRiskZone(
                        1L,
                        updatedZone
                );

        assertNotNull(result);
        assertEquals(
                "Updated Zone",
                result.getZoneName()
        );
        assertEquals(
                6.9500,
                result.getCenterLatitude()
        );
        assertEquals(
                79.9000,
                result.getCenterLongitude()
        );
        assertEquals(
                1000,
                result.getRadiusMeters()
        );
        assertFalse(result.isActive());

        verify(riskZoneRepository, times(1))
                .findById(1L);

        verify(riskZoneRepository, times(1))
                .save(existingZone);
    }

    @Test
    void shouldDeleteRiskZoneSuccessfully() {

        RiskZone existingZone = new RiskZone(
                "Test Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        when(riskZoneRepository.findById(1L))
                .thenReturn(Optional.of(existingZone));

        riskZoneService.deleteRiskZone(1L);

        verify(riskZoneRepository, times(1))
                .findById(1L);

        verify(riskZoneRepository, times(1))
                .delete(existingZone);
    }

    @Test
    void shouldFindContainingRiskZone() {

        RiskZone riskZone = new RiskZone(
                "Test Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        GPSLocation location = new GPSLocation(
                6.9271,
                79.8612,
                LocalDateTime.now(),
                null
        );

        when(riskZoneRepository.findByActiveTrue())
                .thenReturn(List.of(riskZone));

        Optional<RiskZone> result =
                riskZoneService.findContainingZone(location);

        assertTrue(result.isPresent());
        assertEquals(
                "Test Risk Zone",
                result.get().getZoneName()
        );

        verify(riskZoneRepository, times(1))
                .findByActiveTrue();
    }

    @Test
    void shouldReturnEmptyWhenLocationIsOutsideRiskZone() {

        RiskZone riskZone = new RiskZone(
                "Test Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        GPSLocation location = new GPSLocation(
                6.9500,
                79.9000,
                LocalDateTime.now(),
                null
        );

        when(riskZoneRepository.findByActiveTrue())
                .thenReturn(List.of(riskZone));

        Optional<RiskZone> result =
                riskZoneService.findContainingZone(location);

        assertTrue(result.isEmpty());

        verify(riskZoneRepository, times(1))
                .findByActiveTrue();
    }

    @Test
    void shouldIgnoreInactiveRiskZones() {

        when(riskZoneRepository.findByActiveTrue())
                .thenReturn(List.of());

        GPSLocation location = new GPSLocation(
                6.9271,
                79.8612,
                LocalDateTime.now(),
                null
        );

        Optional<RiskZone> result =
                riskZoneService.findContainingZone(location);

        assertTrue(result.isEmpty());

        verify(riskZoneRepository, times(1))
                .findByActiveTrue();
    }
}