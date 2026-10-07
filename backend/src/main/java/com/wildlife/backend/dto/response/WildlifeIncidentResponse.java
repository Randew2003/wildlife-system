package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.IncidentStatus;
import com.wildlife.backend.entity.IncidentType;

import java.time.LocalDateTime;
import java.util.List;

public record WildlifeIncidentResponse(

        Long id,
        IncidentType incidentType,
        Double latitude,
        Double longitude,
        String description,
        LocalDateTime reportedAt,
        IncidentStatus status,
        List<String> photoUrls

) {
}