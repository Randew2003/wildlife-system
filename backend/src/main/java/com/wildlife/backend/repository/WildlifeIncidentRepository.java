package com.wildlife.backend.repository;

import com.wildlife.backend.entity.IncidentStatus;
import com.wildlife.backend.entity.WildlifeIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WildlifeIncidentRepository
        extends JpaRepository<WildlifeIncident, Long> {

    List<WildlifeIncident> findByStatus(IncidentStatus status);
}