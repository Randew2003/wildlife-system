package com.wildlife.backend.service;

import com.wildlife.backend.entity.ConflictReport;
import com.wildlife.backend.entity.ConflictReportStatus;
import com.wildlife.backend.entity.LocationSource;
import com.wildlife.backend.entity.UserAccount;
import com.wildlife.backend.entity.UserRole;
import com.wildlife.backend.repository.ConflictReportRepository;
import com.wildlife.backend.repository.UserAccountRepository;
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

    @Mock
    private UserAccountRepository userAccountRepository;

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
    void assignRanger_shouldAssignCommunityLiaisonAndChangeStatus() {

        ConflictReport report = createReport(ConflictReportStatus.UNDER_REVIEW);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(userAccountRepository.findByEmailIgnoreCaseAndRoleAndEnabledTrue(
                "liaison@example.com",
                UserRole.COMMUNITY_LIAISON_OFFICER))
                .thenReturn(Optional.of(createLiaison()));

        when(conflictReportRepository.save(any(ConflictReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConflictReport result = conflictReportService.assignRanger(
                "TEST-REPORT",
                "liaison@example.com");

        assertEquals(
                "liaison@example.com",
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
    void assignRanger_shouldRejectNonLiaisonResponder() {

        ConflictReport report = createReport(ConflictReportStatus.UNDER_REVIEW);

        when(conflictReportRepository.findByReportId("TEST-REPORT"))
                .thenReturn(Optional.of(report));

        when(userAccountRepository.findByEmailIgnoreCaseAndRoleAndEnabledTrue(
                "ranger@example.com",
                UserRole.COMMUNITY_LIAISON_OFFICER))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> conflictReportService.assignRanger(
                        "TEST-REPORT",
                        "ranger@example.com"));

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
                "Elephant moved away safely.",
                "SOLVED");

        assertEquals(
                ConflictReportStatus.RESOLVED,
                result.getStatus());

        assertEquals(
                "Elephant moved away safely.",
                result.getResponseNotes());

        assertEquals(
                "SOLVED",
                result.getResponseOutcome());

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
    void assignRanger_shouldRejectPendingReport() {

        ConflictReport report = createReport(ConflictReportStatus.PENDING_SYNC);

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
                        "Cannot resolve yet.",
                        "NOT_SOLVED"));

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

    private UserAccount createLiaison() {

        return new UserAccount(
                "Community Liaison",
                "liaison@example.com",
                "hashed-password",
                UserRole.COMMUNITY_LIAISON_OFFICER,
                null,
                true,
                LocalDateTime.now());
    }
}
