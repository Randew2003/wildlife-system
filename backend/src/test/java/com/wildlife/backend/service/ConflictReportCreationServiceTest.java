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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConflictReportCreationServiceTest {

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
                "Elephant observed near residential area.");
        validRequest.setLatitude(6.8201);
        validRequest.setLongitude(80.0240);
        validRequest.setLocationSource(LocationSource.GPS);
        validRequest.setSeverity("MEDIUM");
        validRequest.setPhotoUrl(null);
    }

    @Test
    void createReport_shouldCreateSubmittedReport() {

        when(conflictReportRepository
                .findByConflictTypeAndReportedAtAfter(any(), any()))
                .thenReturn(List.of());

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.createReport(validRequest);

        assertNotNull(result);
        assertNotNull(result.getReportId());
        assertTrue(result.getReportId().startsWith("CONFLICT-"));

        assertEquals(
                "Elephant Sighting",
                result.getConflictType());

        assertEquals(
                "MEDIUM",
                result.getSeverity());

        assertEquals(
                6.8201,
                result.getLatitude());

        assertEquals(
                80.0240,
                result.getLongitude());

        assertEquals(
                LocationSource.GPS,
                result.getLocationSource());

        assertEquals(
                ConflictReportStatus.SUBMITTED,
                result.getStatus());

        assertNotNull(result.getReportedAt());
        assertFalse(result.isPossibleDuplicate());

        verify(conflictReportRepository)
                .save(any(ConflictReport.class));
    }

    @Test
    void createReport_shouldDetectPossibleDuplicate() {

        ConflictReport existingReport = new ConflictReport(
                "CONFLICT-EXISTING",
                "Elephant Sighting",
                "Previous elephant sighting.",
                6.8202,
                80.0241,
                LocationSource.GPS,
                "HIGH",
                null,
                ConflictReportStatus.SUBMITTED,
                LocalDateTime.now());

        when(conflictReportRepository
                .findByConflictTypeAndReportedAtAfter(any(), any()))
                .thenReturn(List.of(existingReport));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.createReport(validRequest);

        assertTrue(result.isPossibleDuplicate());

        verify(conflictReportRepository)
                .save(any(ConflictReport.class));
    }
}