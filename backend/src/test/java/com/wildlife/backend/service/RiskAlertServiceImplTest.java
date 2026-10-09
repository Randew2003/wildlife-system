package com.wildlife.backend.service;

import com.wildlife.backend.entity.AlertStatus;
import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskAlert;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.exception.InvalidAlertStateException;
import com.wildlife.backend.repository.RiskAlertRepository;
import com.wildlife.backend.service.impl.RiskAlertServiceImpl;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskAlertServiceImplTest {

    @Mock
    private RiskAlertRepository riskAlertRepository;

    private RiskAlertServiceImpl riskAlertService;

    @BeforeEach
    void setUp() {
        riskAlertService =
                new RiskAlertServiceImpl(riskAlertRepository);
    }

    @Test
    void shouldCreateNewAlertSuccessfully() {

        Animal animal = mock(Animal.class);

        when(animal.getId()).thenReturn(1L);

        GPSLocation location = new GPSLocation(
                6.9271,
                79.8612,
                LocalDateTime.of(2026, 10, 9, 18, 0),
                animal
        );

        RiskZone riskZone = mock(RiskZone.class);

        when(riskZone.getId()).thenReturn(1L);

        RiskAlert savedAlert = mock(RiskAlert.class);

        when(riskAlertRepository
                .findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
                        eq(1L),
                        eq(1L),
                        anyList()
                ))
                .thenReturn(Optional.empty());

        when(riskAlertRepository.save(any(RiskAlert.class)))
                .thenReturn(savedAlert);

        RiskAlert result =
                riskAlertService.createAlert(
                        location,
                        riskZone
                );

        assertNotNull(result);
        assertSame(savedAlert, result);

        verify(riskAlertRepository, times(1))
                .findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
                        eq(1L),
                        eq(1L),
                        anyList()
                );

        verify(riskAlertRepository, times(1))
                .save(any(RiskAlert.class));
    }

    @Test
    void shouldReturnExistingAlertAndPreventDuplicate() {

        Animal animal = mock(Animal.class);

        when(animal.getId()).thenReturn(2L);

        GPSLocation location = new GPSLocation(
                6.9271,
                79.8612,
                LocalDateTime.now(),
                animal
        );

        RiskZone riskZone = mock(RiskZone.class);

        when(riskZone.getId()).thenReturn(1L);

        RiskAlert existingAlert = mock(RiskAlert.class);

        when(existingAlert.getAlertId())
                .thenReturn("ALERT-EXISTING-001");

        when(riskAlertRepository
                .findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
                        eq(2L),
                        eq(1L),
                        anyList()
                ))
                .thenReturn(Optional.of(existingAlert));

        RiskAlert result =
                riskAlertService.createAlert(
                        location,
                        riskZone
                );

        assertNotNull(result);
        assertSame(existingAlert, result);

        verify(riskAlertRepository, times(1))
                .findFirstByAnimalIdAndRiskZoneIdAndStatusInOrderByIdDesc(
                        eq(2L),
                        eq(1L),
                        anyList()
                );

        verify(riskAlertRepository, never())
                .save(any(RiskAlert.class));
    }

    @Test
    void shouldGetAllAlertsSuccessfully() {

        RiskAlert alert1 = mock(RiskAlert.class);
        RiskAlert alert2 = mock(RiskAlert.class);

        when(riskAlertRepository.findAll())
                .thenReturn(List.of(alert1, alert2));

        List<RiskAlert> result =
                riskAlertService.getAllAlerts();

        assertNotNull(result);
        assertEquals(2, result.size());

        assertSame(alert1, result.get(0));
        assertSame(alert2, result.get(1));

        verify(riskAlertRepository, times(1))
                .findAll();
    }

    @Test
    void shouldGetAlertSuccessfully() {

        RiskAlert alert = mock(RiskAlert.class);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        RiskAlert result =
                riskAlertService.getAlert("ALERT-001");

        assertNotNull(result);
        assertSame(alert, result);

        verify(riskAlertRepository, times(1))
                .findByAlertId("ALERT-001");
    }

    @Test
    void shouldThrowExceptionWhenAlertNotFound() {

        when(riskAlertRepository.findByAlertId(
                "ALERT-NOT-EXIST"
        )).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> riskAlertService.getAlert(
                                "ALERT-NOT-EXIST"
                        )
                );

        assertEquals(
                "Alert not found: ALERT-NOT-EXIST",
                exception.getMessage()
        );

        verify(riskAlertRepository, times(1))
                .findByAlertId("ALERT-NOT-EXIST");
    }

    @Test
    void shouldAcceptDetectedAlert() {

        RiskAlert alert = mock(RiskAlert.class);

        when(alert.getStatus())
                .thenReturn(AlertStatus.DETECTED);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        when(riskAlertRepository.save(alert))
                .thenReturn(alert);

        RiskAlert result =
                riskAlertService.acceptAlert("ALERT-001");

        assertNotNull(result);
        assertSame(alert, result);

        verify(alert, times(1))
                .setStatus(AlertStatus.ACCEPTED);

        verify(riskAlertRepository, times(1))
                .save(alert);
    }

    @Test
    void shouldStartResponseForAcceptedAlert() {

        RiskAlert alert = mock(RiskAlert.class);

        when(alert.getStatus())
                .thenReturn(AlertStatus.ACCEPTED);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        when(riskAlertRepository.save(alert))
                .thenReturn(alert);

        RiskAlert result =
                riskAlertService.startResponse("ALERT-001");

        assertNotNull(result);
        assertSame(alert, result);

        verify(alert, times(1))
                .setStatus(AlertStatus.RESPONDING);

        verify(riskAlertRepository, times(1))
                .save(alert);
    }

    @Test
    void shouldResolveRespondingAlert() {

        RiskAlert alert = mock(RiskAlert.class);

        when(alert.getStatus())
                .thenReturn(AlertStatus.RESPONDING);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        when(riskAlertRepository.save(alert))
                .thenReturn(alert);

        RiskAlert result =
                riskAlertService.resolveAlert("ALERT-001");

        assertNotNull(result);
        assertSame(alert, result);

        verify(alert, times(1))
                .setStatus(AlertStatus.RESOLVED);

        verify(riskAlertRepository, times(1))
                .save(alert);
    }

    @Test
    void shouldRejectInvalidAcceptTransition() {

        RiskAlert alert = mock(RiskAlert.class);

        when(alert.getStatus())
                .thenReturn(AlertStatus.RESPONDING);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        InvalidAlertStateException exception =
                assertThrows(
                        InvalidAlertStateException.class,
                        () -> riskAlertService.acceptAlert(
                                "ALERT-001"
                        )
                );

        assertEquals(
                "Only detected alerts can be accepted.",
                exception.getMessage()
        );

        verify(alert, never())
                .setStatus(any(AlertStatus.class));

        verify(riskAlertRepository, never())
                .save(any(RiskAlert.class));
    }

    @Test
    void shouldRejectInvalidResolveTransition() {

        RiskAlert alert = mock(RiskAlert.class);

        when(alert.getStatus())
                .thenReturn(AlertStatus.ACCEPTED);

        when(riskAlertRepository.findByAlertId("ALERT-001"))
                .thenReturn(Optional.of(alert));

        InvalidAlertStateException exception =
                assertThrows(
                        InvalidAlertStateException.class,
                        () -> riskAlertService.resolveAlert(
                                "ALERT-001"
                        )
                );

        assertEquals(
                "Only responding alerts can be resolved.",
                exception.getMessage()
        );

        verify(alert, never())
                .setStatus(any(AlertStatus.class));

        verify(riskAlertRepository, never())
                .save(any(RiskAlert.class));
    }
}