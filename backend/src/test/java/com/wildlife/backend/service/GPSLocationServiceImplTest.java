package com.wildlife.backend.service;

import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.AnimalRepository;
import com.wildlife.backend.repository.GPSLocationRepository;
import com.wildlife.backend.service.impl.GPSLocationServiceImpl;
import com.wildlife.backend.service.interfaces.RiskAlertService;
import com.wildlife.backend.service.interfaces.RiskZoneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GPSLocationServiceImplTest {

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private GPSLocationRepository gpsLocationRepository;

    @Mock
    private RiskZoneService riskZoneService;

    @Mock
    private RiskAlertService riskAlertService;

    private GPSLocationServiceImpl gpsLocationService;

    @BeforeEach
    void setUp() {

        gpsLocationService =
                new GPSLocationServiceImpl(
                        animalRepository,
                        gpsLocationRepository,
                        riskZoneService,
                        riskAlertService
                );
    }

    @Test
    void shouldProcessLocationSuccessfully() {

        Animal animal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        LocalDateTime recordedAt =
                LocalDateTime.of(
                        2026,
                        10,
                        9,
                        18,
                        0
                );

        GPSLocation savedLocation =
                new GPSLocation(
                        6.9271,
                        79.8612,
                        recordedAt,
                        animal
                );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.of(animal));

        when(gpsLocationRepository.save(any(GPSLocation.class)))
                .thenReturn(savedLocation);

        when(riskZoneService.findContainingZone(savedLocation))
                .thenReturn(Optional.empty());

        GPSLocation result =
                gpsLocationService.processLocation(
                        "ELE-TEST-001",
                        6.9271,
                        79.8612,
                        recordedAt
                );

        assertNotNull(result);
        assertEquals(6.9271, result.getLatitude());
        assertEquals(79.8612, result.getLongitude());
        assertEquals(
                "ELE-TEST-001",
                result.getAnimal().getAnimalId()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");

        verify(gpsLocationRepository, times(1))
                .save(any(GPSLocation.class));

        verify(riskZoneService, times(1))
                .findContainingZone(savedLocation);

        verify(riskAlertService, never())
                .createAlert(
                        any(GPSLocation.class),
                        any(RiskZone.class)
                );
    }

    @Test
    void shouldThrowExceptionWhenAnimalNotFound() {

        when(animalRepository.findByAnimalId("INVALID-ANIMAL"))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> gpsLocationService.processLocation(
                                "INVALID-ANIMAL",
                                6.9271,
                                79.8612,
                                LocalDateTime.now()
                        )
                );

        assertEquals(
                "Animal not found: INVALID-ANIMAL",
                exception.getMessage()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("INVALID-ANIMAL");

        verify(gpsLocationRepository, never())
                .save(any(GPSLocation.class));

        verify(riskZoneService, never())
                .findContainingZone(any(GPSLocation.class));

        verify(riskAlertService, never())
                .createAlert(
                        any(GPSLocation.class),
                        any(RiskZone.class)
                );
    }

    @Test
    void shouldThrowExceptionWhenCollarIsInactive() {

        Animal animal = new Animal(
                "ELE-TEST-002",
                "Elephant",
                "Muthu",
                false
        );

        when(animalRepository.findByAnimalId("ELE-TEST-002"))
                .thenReturn(Optional.of(animal));

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () -> gpsLocationService.processLocation(
                                "ELE-TEST-002",
                                6.9271,
                                79.8612,
                                LocalDateTime.now()
                        )
                );

        assertEquals(
                "GPS collar is not active for animal: ELE-TEST-002",
                exception.getMessage()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-002");

        verify(gpsLocationRepository, never())
                .save(any(GPSLocation.class));

        verify(riskZoneService, never())
                .findContainingZone(any(GPSLocation.class));

        verify(riskAlertService, never())
                .createAlert(
                        any(GPSLocation.class),
                        any(RiskZone.class)
                );
    }

    @Test
    void shouldCreateAlertWhenLocationIsInsideRiskZone() {

        Animal animal = new Animal(
                "ELE-TEST-003",
                "Elephant",
                "Kumari",
                true
        );

        LocalDateTime recordedAt =
                LocalDateTime.of(
                        2026,
                        10,
                        9,
                        18,
                        30
                );

        GPSLocation savedLocation =
                new GPSLocation(
                        6.9271,
                        79.8612,
                        recordedAt,
                        animal
                );

        RiskZone riskZone = new RiskZone(
                "Test High Risk Zone",
                6.9271,
                79.8612,
                500,
                true
        );

        RiskAlert riskAlert = mock(RiskAlert.class);

        when(animalRepository.findByAnimalId("ELE-TEST-003"))
                .thenReturn(Optional.of(animal));

        when(gpsLocationRepository.save(any(GPSLocation.class)))
                .thenReturn(savedLocation);

        when(riskZoneService.findContainingZone(savedLocation))
                .thenReturn(Optional.of(riskZone));

        when(riskAlertService.createAlert(
                savedLocation,
                riskZone
        )).thenReturn(riskAlert);

        when(riskAlert.getAlertId())
                .thenReturn("ALERT-TEST-001");

        GPSLocation result =
                gpsLocationService.processLocation(
                        "ELE-TEST-003",
                        6.9271,
                        79.8612,
                        recordedAt
                );

        assertNotNull(result);

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-003");

        verify(gpsLocationRepository, times(1))
                .save(any(GPSLocation.class));

        verify(riskZoneService, times(1))
                .findContainingZone(savedLocation);

        verify(riskAlertService, times(1))
                .createAlert(
                        savedLocation,
                        riskZone
                );
    }

    @Test
    void shouldNotCreateAlertWhenLocationIsOutsideRiskZone() {

        Animal animal = new Animal(
                "ELE-TEST-004",
                "Elephant",
                "Sena",
                true
        );

        LocalDateTime recordedAt =
                LocalDateTime.of(
                        2026,
                        10,
                        9,
                        19,
                        0
                );

        GPSLocation savedLocation =
                new GPSLocation(
                        7.0000,
                        80.0000,
                        recordedAt,
                        animal
                );

        when(animalRepository.findByAnimalId("ELE-TEST-004"))
                .thenReturn(Optional.of(animal));

        when(gpsLocationRepository.save(any(GPSLocation.class)))
                .thenReturn(savedLocation);

        when(riskZoneService.findContainingZone(savedLocation))
                .thenReturn(Optional.empty());

        GPSLocation result =
                gpsLocationService.processLocation(
                        "ELE-TEST-004",
                        7.0000,
                        80.0000,
                        recordedAt
                );

        assertNotNull(result);

        verify(gpsLocationRepository, times(1))
                .save(any(GPSLocation.class));

        verify(riskZoneService, times(1))
                .findContainingZone(savedLocation);

        verify(riskAlertService, never())
                .createAlert(
                        any(GPSLocation.class),
                        any(RiskZone.class)
                );
    }
}