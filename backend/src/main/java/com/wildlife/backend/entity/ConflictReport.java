package com.wildlife.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conflict_reports")
public class ConflictReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reportId;

    @Column(nullable = false)
    private String conflictType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationSource locationSource;

    @Column(nullable = false)
    private String severity;

    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConflictReportStatus status;

    private String assignedRanger;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    private LocalDateTime resolvedAt;

    private String responseNotes;

    @Column(nullable = false)
    private boolean possibleDuplicate;

    public ConflictReport() {
    }

    public ConflictReport(
            String reportId,
            String conflictType,
            String description,
            Double latitude,
            Double longitude,
            LocationSource locationSource,
            String severity,
            String photoUrl,
            ConflictReportStatus status,
            LocalDateTime reportedAt) {

        this.reportId = reportId;
        this.conflictType = conflictType;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationSource = locationSource;
        this.severity = severity;
        this.photoUrl = photoUrl;
        this.status = status;
        this.reportedAt = reportedAt;
        this.possibleDuplicate = false;
    }

    public Long getId() {
        return id;
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getConflictType() {
        return conflictType;
    }

    public void setConflictType(String conflictType) {
        this.conflictType = conflictType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocationSource getLocationSource() {
        return locationSource;
    }

    public void setLocationSource(LocationSource locationSource) {
        this.locationSource = locationSource;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public ConflictReportStatus getStatus() {
        return status;
    }

    public void setStatus(ConflictReportStatus status) {
        this.status = status;
    }

    public String getAssignedRanger() {
        return assignedRanger;
    }

    public void setAssignedRanger(String assignedRanger) {
        this.assignedRanger = assignedRanger;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResponseNotes() {
        return responseNotes;
    }

    public void setResponseNotes(String responseNotes) {
        this.responseNotes = responseNotes;
    }

    public boolean isPossibleDuplicate() {
        return possibleDuplicate;
    }

    public void setPossibleDuplicate(boolean possibleDuplicate) {
        this.possibleDuplicate = possibleDuplicate;
    }
}
