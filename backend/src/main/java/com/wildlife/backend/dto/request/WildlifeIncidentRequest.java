package com.wildlife.backend.dto.request;

import com.wildlife.backend.entity.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record WildlifeIncidentRequest(

        @NotNull(message = "Incident type is required") IncidentType incidentType,

        @NotNull(message = "Latitude is required") Double latitude,

        @NotNull(message = "Longitude is required") Double longitude,

        @NotBlank(message = "Description is required") @Size(max = 500, message = "Description must not exceed 500 characters") String description,

        List<String> photoUrls) {
}