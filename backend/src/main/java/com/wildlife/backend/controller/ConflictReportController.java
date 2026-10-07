package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.ConflictReportRequest;
import com.wildlife.backend.dto.response.ConflictReportResponse;
import com.wildlife.backend.entity.ConflictReport;
import com.wildlife.backend.service.interfaces.ConflictReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conflict-reports")
public class ConflictReportController {

        private final ConflictReportService conflictReportService;

        public ConflictReportController(
                        ConflictReportService conflictReportService) {

                this.conflictReportService = conflictReportService;
        }

        @PostMapping
        public ResponseEntity<ConflictReportResponse> createReport(
                        @Valid @RequestBody ConflictReportRequest request) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.createReport(request)));
        }

        @PostMapping("/offline")
        public ResponseEntity<ConflictReportResponse> createOfflineReport(
                        @Valid @RequestBody ConflictReportRequest request) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.createOfflineReport(request)));
        }

        @PutMapping("/{reportId}/sync")
        public ResponseEntity<ConflictReportResponse> syncReport(
                        @PathVariable String reportId) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.syncReport(reportId)));
        }

        @GetMapping
        public ResponseEntity<List<ConflictReportResponse>> getAllReports() {

                List<ConflictReportResponse> responses = conflictReportService.getAllReports()
                                .stream()
                                .map(this::toResponse)
                                .toList();

                return ResponseEntity.ok(responses);
        }

        @GetMapping("/{reportId}")
        public ResponseEntity<ConflictReportResponse> getReport(
                        @PathVariable String reportId) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.getReport(reportId)));
        }

        @PutMapping("/{reportId}/review")
        public ResponseEntity<ConflictReportResponse> submitForReview(
                        @PathVariable String reportId) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.submitForReview(reportId)));
        }

        @PutMapping("/{reportId}/assign")
        public ResponseEntity<ConflictReportResponse> assignRanger(
                        @PathVariable String reportId,
                        @RequestParam String ranger) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.assignRanger(
                                                                reportId,
                                                                ranger)));
        }

        @PutMapping("/{reportId}/respond")
        public ResponseEntity<ConflictReportResponse> startResponse(
                        @PathVariable String reportId) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.startResponse(reportId)));
        }

        @PutMapping("/{reportId}/resolve")
        public ResponseEntity<ConflictReportResponse> resolveReport(
                        @PathVariable String reportId,
                        @RequestParam(required = false) String responseNotes) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.resolveReport(
                                                                reportId,
                                                                responseNotes)));
        }

        @PutMapping("/{reportId}/close")
        public ResponseEntity<ConflictReportResponse> closeReport(
                        @PathVariable String reportId) {

                return ResponseEntity.ok(
                                toResponse(
                                                conflictReportService.closeReport(reportId)));
        }

        private ConflictReportResponse toResponse(
                        ConflictReport report) {

                return new ConflictReportResponse(
                                report.getReportId(),
                                report.getConflictType(),
                                report.getDescription(),
                                report.getLatitude(),
                                report.getLongitude(),
                                report.getLocationSource(),
                                report.getSeverity(),
                                report.getPhotoUrl(),
                                report.getStatus(),
                                report.getAssignedRanger(),
                                report.getReportedAt(),
                                report.getResolvedAt(),
                                report.getResponseNotes(),
                                report.isPossibleDuplicate());
        }
}
