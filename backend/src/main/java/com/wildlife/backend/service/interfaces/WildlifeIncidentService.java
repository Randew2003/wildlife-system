package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.dto.request.WildlifeIncidentRequest;
import com.wildlife.backend.dto.response.WildlifeIncidentResponse;

import java.util.List;

public interface WildlifeIncidentService {

    WildlifeIncidentResponse createIncident(WildlifeIncidentRequest request);

    WildlifeIncidentResponse getIncidentById(Long id);

    List<WildlifeIncidentResponse> getAllIncidents();

    WildlifeIncidentResponse retrySync(Long id);
}