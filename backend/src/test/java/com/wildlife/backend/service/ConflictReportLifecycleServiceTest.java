package com.wildlife.backend.service;

import com.wildlife.backend.entity.ConflictReport;
import com.wildlife.backend.entity.ConflictReportStatus;
import com.wildlife.backend.entity.LocationSource;
import com.wildlife.backend.repository.ConflictReportRepository;
import com.wildlife.backend.service.impl.ConflictReportServiceImpl;
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
class ConflictReportLifecycleServiceTest {

    @Mock
    private ConflictReportRepository conflictReportRepository;

    @InjectMocks
    private ConflictReportServiceImpl conflictReportService;

    @Test
    void submitForReview_shouldChangeSubmittedToUnderReview() {

        ConflictReport report = createReport(ConflictReportStatus.SUBMITTED);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.submitForReview("TEST-REPORT");

        assertEquals(
                ConflictReportStatus.UNDER_REVIEW,
                result.getStatus());

        verify(conflictReportRepository).save(report);
    }

    @Test
    void assignRanger_shouldAssignRangerAndChangeStatus() {

        ConflictReport report = createReport(ConflictReportStatus.UNDER_REVIEW);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.assignRanger(
                "TEST-REPORT",
                "Ranger Kamal");

        assertEquals(
                "Ranger Kamal",
                result.getAssignedRanger());

        assertEquals(
                ConflictReportStatus.ASSIGNED,
                result.getStatus());

        verify(conflictReportRepository).save(report);
    }

    @Test
    void assignRanger_shouldRejectBlankRanger() {

        ConflictReport report = createReport(ConflictReportStatus.UNDER_REVIEW);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalArgumentException.class,
                () -> conflictReportService.assignRanger(
                        "TEST-REPORT",
                        ""));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    @Test
    void startResponse_shouldChangeAssignedToResponding() {

        ConflictReport report = createReport(ConflictReportStatus.ASSIGNED);

        report.setAssignedRanger("Ranger Kamal");

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.startResponse("TEST-REPORT");

        assertEquals(
                ConflictReportStatus.RESPONDING,
                result.getStatus());

        verify(conflictReportRepository).save(report);
    }

    @Test
    void resolveReport_shouldChangeRespondingToResolved() {

        ConflictReport report = createReport(ConflictReportStatus.RESPONDING);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.resolveReport(
                "TEST-REPORT",
                "Elephant moved away safely.");

        assertEquals(
                ConflictReportStatus.RESOLVED,
                result.getStatus());

        assertEquals(
                "Elephant moved away safely.",
                result.getResponseNotes());

        assertNotNull(result.getResolvedAt());

        verify(conflictReportRepository).save(report);
    }

    @Test
    void closeReport_shouldChangeResolvedToClosed() {

        ConflictReport report = createReport(ConflictReportStatus.RESOLVED);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.closeReport("TEST-REPORT");

        assertEquals(
                ConflictReportStatus.CLOSED,
                result.getStatus());

        verify(conflictReportRepository).save(report);
    }

    @Test
    void submitForReview_shouldRejectNonSubmittedReport() {

        ConflictReport report = createReport(ConflictReportStatus.PENDING_SYNC);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.submitForReview(
                        "TEST-REPORT"));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    @Test
    void assignRanger_shouldRejectNonReviewReport() {

        ConflictReport report = createReport(ConflictReportStatus.SUBMITTED);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.assignRanger(
                        "TEST-REPORT",
                        "Ranger Kamal"));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    @Test
    void startResponse_shouldRejectUnassignedReport() {

        ConflictReport report = createReport(ConflictReportStatus.UNDER_REVIEW);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.startResponse(
                        "TEST-REPORT"));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    @Test
    void resolveReport_shouldRejectNonRespondingReport() {

        ConflictReport report = createReport(ConflictReportStatus.ASSIGNED);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.resolveReport(
                        "TEST-REPORT",
                        "Cannot resolve yet."));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    @Test
    void closeReport_shouldRejectNonResolvedReport() {

        ConflictReport report = createReport(ConflictReportStatus.RESPONDING);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        assertThrows(
                IllegalStateException.class,
                () -> conflictReportService.closeReport(
                        "TEST-REPORT"));

        verify(
                conflictReportRepository,
                never()).save(any(ConflictReport.class));
    }

    private ConflictReport createReport(
            ConflictReportStatus status) {

        return new ConflictReport(
                "TEST-REPORT",
                "Elephant Sighting",
                "Test conflict report.",
                6.8201,
                80.0240,
                LocationSource.GPS,
                "MEDIUM",
                null,
                status,
                LocalDateTime.now());
    }
}