package com.wildlife.backend.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wildlife_incidents")
@Getter
@Setter
@Builder
public class WildlifeIncident {

    public WildlifeIncident() {
    }

    public WildlifeIncident(Long id, IncidentType incidentType, Double latitude, Double longitude,
                           String description, LocalDateTime reportedAt, IncidentStatus status,
                           List<String> photoUrls) {
        this.id = id;
        this.incidentType = incidentType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.reportedAt = reportedAt;
        this.status = status;
        this.photoUrls = photoUrls;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentType incidentType;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;

    @ElementCollection
    @CollectionTable(
            name = "wildlife_incident_photos",
            joinColumns = @JoinColumn(name = "incident_id")
    )
    @Column(name = "photo_url", nullable = false)
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();
}