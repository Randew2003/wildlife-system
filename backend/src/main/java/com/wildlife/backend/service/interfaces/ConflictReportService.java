package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.dto.request.ConflictReportRequest;
import com.wildlife.backend.entity.ConflictReport;

import java.util.List;

public interface ConflictReportService {

    ConflictReport createReport(ConflictReportRequest request);

    ConflictReport createOfflineReport(ConflictReportRequest request);

    ConflictReport syncReport(String reportId);

    List<ConflictReport> getAllReports();

    ConflictReport getReport(String reportId);

    ConflictReport submitForReview(String reportId);

    ConflictReport assignRanger(String reportId, String ranger);

    ConflictReport startResponse(String reportId);

    ConflictReport resolveReport(String reportId, String responseNotes);

    ConflictReport closeReport(String reportId);
}
