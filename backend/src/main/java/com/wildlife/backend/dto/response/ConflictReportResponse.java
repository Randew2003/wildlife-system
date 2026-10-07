package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.ConflictReportStatus;
import com.wildlife.backend.entity.LocationSource;

import java.time.LocalDateTime;

public class ConflictReportResponse {

    private String reportId;
    private String conflictType;
    private String description;
    private Double latitude;
    private Double longitude;
    private LocationSource locationSource;
    private String severity;
    private String photoUrl;
    private ConflictReportStatus status;
    private String assignedRanger;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
    private String responseNotes;
    private boolean possibleDuplicate;

    public ConflictReportResponse(
            String reportId,
            String conflictType,
            String description,
            Double latitude,
            Double longitude,
            LocationSource locationSource,
            String severity,
            String photoUrl,
            ConflictReportStatus status,
            String assignedRanger,
            LocalDateTime reportedAt,
            LocalDateTime resolvedAt,
            String responseNotes,
            boolean possibleDuplicate) {

        this.reportId = reportId;
        this.conflictType = conflictType;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationSource = locationSource;
        this.severity = severity;
        this.photoUrl = photoUrl;
        this.status = status;
        this.assignedRanger = assignedRanger;
        this.reportedAt = reportedAt;
        this.resolvedAt = resolvedAt;
        this.responseNotes = responseNotes;
        this.possibleDuplicate = possibleDuplicate;
    }

    public String getReportId() {
        return reportId;
    }

    public String getConflictType() {
        return conflictType;
    }

    public String getDescription() {
        return description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocationSource getLocationSource() {
        return locationSource;
    }

    public String getSeverity() {
        return severity;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public ConflictReportStatus getStatus() {
        return status;
    }

    public String getAssignedRanger() {
        return assignedRanger;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public String getResponseNotes() {
        return responseNotes;
    }

    public boolean isPossibleDuplicate() {
        return possibleDuplicate;
    }
}
