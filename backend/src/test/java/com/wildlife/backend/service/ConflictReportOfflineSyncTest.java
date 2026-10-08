package com.wildlife.backend.service;

import com.wildlife.backend.dto.request.ConflictReportRequest;
import com.wildlife.backend.entity.ConflictReport;
import com.wildlife.backend.entity.ConflictReportStatus;
import com.wildlife.backend.entity.LocationSource;
import com.wildlife.backend.repository.ConflictReportRepository;
import com.wildlife.backend.service.impl.ConflictReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConflictReportOfflineSyncTest {

    @Mock
    private ConflictReportRepository conflictReportRepository;

    @InjectMocks
    private ConflictReportServiceImpl conflictReportService;

    private ConflictReportRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new ConflictReportRequest();

        validRequest.setConflictType("Elephant Sighting");
        validRequest.setDescription(
                "Elephant observed while network was unavailable.");
        validRequest.setLatitude(6.8201);
        validRequest.setLongitude(80.0240);
        validRequest.setLocationSource(LocationSource.GPS);
        validRequest.setSeverity("MEDIUM");
        validRequest.setPhotoUrl(null);
    }

    @Test
    void createOfflineReport_shouldCreatePendingSyncReport() {

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.createOfflineReport(validRequest);

        assertNotNull(result);
        assertNotNull(result.getReportId());

        assertTrue(
                result.getReportId().startsWith("CONFLICT-"));

        assertEquals(
                ConflictReportStatus.PENDING_SYNC,
                result.getStatus());

        assertEquals(
                "Elephant Sighting",
                result.getConflictType());

        assertNotNull(result.getReportedAt());

        verify(conflictReportRepository)
                .save(any(ConflictReport.class));
    }

    @Test
    void syncReport_shouldChangePendingSyncToSubmitted() {

        ConflictReport report = new ConflictReport(
                "CONFLICT-OFFLINE",
                "Elephant Sighting",
                "Offline report.",
                6.8201,
                80.0240,
                LocationSource.GPS,
                "MEDIUM",
                null,
                ConflictReportStatus.PENDING_SYNC,
                LocalDateTime.now());

        when(conflictReportRepository
                .findByReportId("CONFLICT-OFFLINE"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.syncReport(
                "CONFLICT-OFFLINE");

        assertEquals(
                ConflictReportStatus.SUBMITTED,
                result.getStatus());

        verify(conflictReportRepository)
                .save(report);
    }

    @Test
    void syncReport_shouldRejectAlreadySubmittedReport() {

        ConflictReport report = new ConflictReport(
                "CONFLICT-SUBMITTED",
                "Elephant Sighting",
                "Already submitted report.",
                6.8201,
                80.0240,
                LocationSource.GPS,
                "MEDIUM",
                null,
                ConflictReportStatus.SUBMITTED,
                LocalDateTime.now());

        when(conflictReportRepository
                .findByReportId("CONFLICT-SUBMITTED"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.syncReport(
                        "CONFLICT-SUBMITTED"));

        verify(conflictReportRepository, never())
                .save(any(ConflictReport.class));
    }
}