package com.wildlife.backend.service.impl;

import com.wildlife.backend.dto.request.WildlifeIncidentRequest;
import com.wildlife.backend.dto.response.WildlifeIncidentResponse;
import com.wildlife.backend.entity.IncidentStatus;
import com.wildlife.backend.entity.WildlifeIncident;
import com.wildlife.backend.exception.WildlifeIncidentNotFoundException;
import com.wildlife.backend.repository.WildlifeIncidentRepository;
import com.wildlife.backend.service.interfaces.WildlifeIncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WildlifeIncidentServiceImpl implements WildlifeIncidentService {

        private final WildlifeIncidentRepository wildlifeIncidentRepository;

        @Override
        public WildlifeIncidentResponse createIncident(WildlifeIncidentRequest request) {

                validateCoordinates(request.latitude(), request.longitude());

                WildlifeIncident incident = WildlifeIncident.builder()
                                .incidentType(request.incidentType())
                                .latitude(request.latitude())
                                .longitude(request.longitude())
                                .description(request.description().trim())
                                .reportedAt(LocalDateTime.now())
                                .status(IncidentStatus.SYNCED)
                                .photoUrls(
                                                request.photoUrls() == null
                                                                ? new ArrayList<>()
                                                                : new ArrayList<>(request.photoUrls()))
                                .build();

                WildlifeIncident savedIncident = wildlifeIncidentRepository.save(incident);

                return mapToResponse(savedIncident);
        }

        @Override
        @Transactional(readOnly = true)
        public WildlifeIncidentResponse getIncidentById(Long id) {

                WildlifeIncident incident = wildlifeIncidentRepository.findById(id)
                                .orElseThrow(() -> new WildlifeIncidentNotFoundException(id));

                return mapToResponse(incident);
        }

        @Override
        @Transactional(readOnly = true)
        public List<WildlifeIncidentResponse> getAllIncidents() {

                return wildlifeIncidentRepository.findAll()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        public WildlifeIncidentResponse retrySync(Long id) {

                WildlifeIncident incident = wildlifeIncidentRepository.findById(id)
                                .orElseThrow(() -> new WildlifeIncidentNotFoundException(id));

                incident.setStatus(IncidentStatus.SYNCED);

                WildlifeIncident updatedIncident = wildlifeIncidentRepository.save(incident);

                return mapToResponse(updatedIncident);
        }

        private void validateCoordinates(Double latitude, Double longitude) {

                if (latitude < -90 || latitude > 90) {
                        throw new IllegalArgumentException(
                                        "Latitude must be between -90 and 90");
                }

                if (longitude < -180 || longitude > 180) {
                        throw new IllegalArgumentException(
                                        "Longitude must be between -180 and 180");
                }
        }

        private WildlifeIncidentResponse mapToResponse(
                        WildlifeIncident incident) {

                return new WildlifeIncidentResponse(
                                incident.getId(),
                                incident.getIncidentType(),
                                incident.getLatitude(),
                                incident.getLongitude(),
                                incident.getDescription(),
                                incident.getReportedAt(),
                                incident.getStatus(),
                                new ArrayList<>(incident.getPhotoUrls()));
        }
}