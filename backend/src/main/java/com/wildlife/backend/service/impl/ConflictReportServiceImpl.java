package com.wildlife.backend.service.impl;

import com.wildlife.backend.dto.request.ConflictReportRequest;
import com.wildlife.backend.entity.ConflictReport;
import com.wildlife.backend.entity.ConflictReportStatus;
import com.wildlife.backend.repository.ConflictReportRepository;
import com.wildlife.backend.service.interfaces.ConflictReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ConflictReportServiceImpl implements ConflictReportService {

    private final ConflictReportRepository conflictReportRepository;

    public ConflictReportServiceImpl(
            ConflictReportRepository conflictReportRepository) {

        this.conflictReportRepository = conflictReportRepository;
    }

    @Override
    public ConflictReport createReport(ConflictReportRequest request) {

        String reportId = "CONFLICT-" + UUID.randomUUID();

        LocalDateTime now = LocalDateTime.now();

        List<ConflictReport> recentReports = conflictReportRepository.findByConflictTypeAndReportedAtAfter(
                request.getConflictType(),
                now.minusHours(24));

        boolean possibleDuplicate = recentReports.stream()
                .anyMatch(existing -> Math.abs(existing.getLatitude() - request.getLatitude()) < 0.01
                        && Math.abs(existing.getLongitude() - request.getLongitude()) < 0.01);

        ConflictReport report = new ConflictReport(
                reportId,
                request.getConflictType(),
                request.getDescription(),
                request.getLatitude(),
                request.getLongitude(),
                request.getLocationSource(),
                request.getSeverity(),
                request.getPhotoUrl(),
                ConflictReportStatus.SUBMITTED,
                now);

        report.setPossibleDuplicate(possibleDuplicate);

        return conflictReportRepository.save(report);
    }

    @Override
    public ConflictReport createOfflineReport(
            ConflictReportRequest request) {

        String reportId = "CONFLICT-" + UUID.randomUUID();

        LocalDateTime now = LocalDateTime.now();

        ConflictReport report = new ConflictReport(
                reportId,
                request.getConflictType(),
                request.getDescription(),
                request.getLatitude(),
                request.getLongitude(),
                request.getLocationSource(),
                request.getSeverity(),
                request.getPhotoUrl(),
                ConflictReportStatus.PENDING_SYNC,
                now);

        return conflictReportRepository.save(report);
    }

    @Transactional
    @Override
    public ConflictReport syncReport(String reportId) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.PENDING_SYNC) {
            throw new IllegalStateException(
                    "Only pending reports can be synchronized.");
        }

        report.setStatus(ConflictReportStatus.SUBMITTED);

        return conflictReportRepository.save(report);
    }

    @Override
    public List<ConflictReport> getAllReports() {
        return conflictReportRepository.findAllByOrderByReportedAtDesc();
    }

    @Override
    public ConflictReport getReport(String reportId) {

        return conflictReportRepository.findByReportId(reportId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conflict report not found: " + reportId));
    }

    @Transactional
    @Override
    public ConflictReport submitForReview(String reportId) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.SUBMITTED) {
            throw new IllegalStateException(
                    "Only submitted reports can be moved to review.");
        }

        report.setStatus(ConflictReportStatus.UNDER_REVIEW);

        return conflictReportRepository.save(report);
    }

    @Transactional
    @Override
    public ConflictReport assignRanger(
            String reportId,
            String ranger) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.UNDER_REVIEW) {
            throw new IllegalStateException(
                    "Only reports under review can be assigned.");
        }

        if (ranger == null || ranger.isBlank()) {
            throw new IllegalArgumentException(
                    "Ranger is required.");
        }

        report.setAssignedRanger(ranger);
        report.setStatus(ConflictReportStatus.ASSIGNED);

        return conflictReportRepository.save(report);
    }

    @Transactional
    @Override
    public ConflictReport startResponse(String reportId) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.ASSIGNED) {
            throw new IllegalStateException(
                    "Only assigned reports can start a response.");
        }

        report.setStatus(ConflictReportStatus.RESPONDING);

        return conflictReportRepository.save(report);
    }

    @Transactional
    @Override
    public ConflictReport resolveReport(
            String reportId,
            String responseNotes) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.RESPONDING) {
            throw new IllegalStateException(
                    "Only responding reports can be resolved.");
        }

        report.setStatus(ConflictReportStatus.RESOLVED);
        report.setResponseNotes(responseNotes);
        report.setResolvedAt(LocalDateTime.now());

        return conflictReportRepository.save(report);
    }

    @Transactional
    @Override
    public ConflictReport closeReport(String reportId) {

        ConflictReport report = getReport(reportId);

        if (report.getStatus() != ConflictReportStatus.RESOLVED) {
            throw new IllegalStateException(
                    "Only resolved reports can be closed.");
        }

        report.setStatus(ConflictReportStatus.CLOSED);

        return conflictReportRepository.save(report);
    }
}
