package com.wildlife.backend.repository;

import com.wildlife.backend.entity.ConflictReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

public interface ConflictReportRepository
        extends JpaRepository<ConflictReport, Long> {

    List<ConflictReport> findAllByOrderByReportedAtDesc();

    Optional<ConflictReport> findByReportId(String reportId);

    List<ConflictReport> findByConflictTypeAndReportedAtAfter(
            String conflictType,
            LocalDateTime reportedAt);
}
