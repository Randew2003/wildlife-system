package com.wildlife.backend.service;

import com.wildlife.backend.dto.request.WildlifeIncidentRequest;
import com.wildlife.backend.dto.response.WildlifeIncidentResponse;
import com.wildlife.backend.entity.IncidentStatus;
import com.wildlife.backend.entity.IncidentType;
import com.wildlife.backend.entity.WildlifeIncident;
import com.wildlife.backend.exception.WildlifeIncidentNotFoundException;
import com.wildlife.backend.repository.WildlifeIncidentRepository;
import com.wildlife.backend.service.impl.WildlifeIncidentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WildlifeIncidentServiceImplTest {

    @Mock
    private WildlifeIncidentRepository wildlifeIncidentRepository;

    private WildlifeIncidentServiceImpl wildlifeIncidentService;

    @BeforeEach
    void setUp() {
        wildlifeIncidentService =
                new WildlifeIncidentServiceImpl(wildlifeIncidentRepository);
    }

    @Test
    void shouldCreateWildlifeIncidentSuccessfully() {

        WildlifeIncidentRequest request =
                new WildlifeIncidentRequest(
                        IncidentType.SNARE,
                        7.2906,
                        80.6337,
                        "Snare found near patrol route",
                        List.of("photo1.jpg", "photo2.jpg")
                );

        WildlifeIncident savedIncident = WildlifeIncident.builder()
                .id(1L)
                .incidentType(IncidentType.SNARE)
                .latitude(7.2906)
                .longitude(80.6337)
                .description("Snare found near patrol route")
                .reportedAt(LocalDateTime.now())
                .status(IncidentStatus.SYNCED)
                .photoUrls(List.of("photo1.jpg", "photo2.jpg"))
                .build();

        when(wildlifeIncidentRepository.save(any(WildlifeIncident.class)))
                .thenReturn(savedIncident);

        WildlifeIncidentResponse response =
                wildlifeIncidentService.createIncident(request);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals(IncidentType.SNARE, response.incidentType());
        assertEquals(IncidentStatus.SYNCED, response.status());
        assertEquals(2, response.photoUrls().size());

        verify(wildlifeIncidentRepository, times(1))
                .save(any(WildlifeIncident.class));
    }

    @Test
    void shouldThrowExceptionForInvalidLatitude() {

        WildlifeIncidentRequest request =
                new WildlifeIncidentRequest(
                        IncidentType.SNARE,
                        100.0,
                        80.6337,
                        "Invalid latitude test",
                        List.of()
                );

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> wildlifeIncidentService.createIncident(request)
                );

        assertEquals(
                "Latitude must be between -90 and 90",
                exception.getMessage()
        );

        verify(wildlifeIncidentRepository, never())
                .save(any(WildlifeIncident.class));
    }

    @Test
    void shouldThrowExceptionForInvalidLongitude() {

        WildlifeIncidentRequest request =
                new WildlifeIncidentRequest(
                        IncidentType.ANIMAL_CARCASS,
                        7.2906,
                        200.0,
                        "Invalid longitude test",
                        List.of()
                );

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> wildlifeIncidentService.createIncident(request)
                );

        assertEquals(
                "Longitude must be between -180 and 180",
                exception.getMessage()
        );

        verify(wildlifeIncidentRepository, never())
                .save(any(WildlifeIncident.class));
    }

    @Test
    void shouldGetIncidentByIdSuccessfully() {

        WildlifeIncident incident = WildlifeIncident.builder()
                .id(1L)
                .incidentType(IncidentType.ILLEGAL_CAMPSITE)
                .latitude(7.2906)
                .longitude(80.6337)
                .description("Illegal campsite found")
                .reportedAt(LocalDateTime.now())
                .status(IncidentStatus.SYNCED)
                .photoUrls(List.of("camp.jpg"))
                .build();

        when(wildlifeIncidentRepository.findById(1L))
                .thenReturn(Optional.of(incident));

        WildlifeIncidentResponse response =
                wildlifeIncidentService.getIncidentById(1L);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals(
                IncidentType.ILLEGAL_CAMPSITE,
                response.incidentType()
        );
        assertEquals("Illegal campsite found", response.description());

        verify(wildlifeIncidentRepository, times(1))
                .findById(1L);
    }

    @Test
    void shouldThrowExceptionWhenIncidentNotFound() {

        when(wildlifeIncidentRepository.findById(999L))
                .thenReturn(Optional.empty());

        WildlifeIncidentNotFoundException exception =
                assertThrows(
                        WildlifeIncidentNotFoundException.class,
                        () -> wildlifeIncidentService.getIncidentById(999L)
                );

        assertEquals(
                "Wildlife incident not found with id: 999",
                exception.getMessage()
        );

        verify(wildlifeIncidentRepository, times(1))
                .findById(999L);
    }

    @Test
    void shouldGetAllIncidentsSuccessfully() {

        WildlifeIncident incident1 = WildlifeIncident.builder()
                .id(1L)
                .incidentType(IncidentType.SNARE)
                .latitude(7.2906)
                .longitude(80.6337)
                .description("Snare found")
                .reportedAt(LocalDateTime.now())
                .status(IncidentStatus.SYNCED)
                .photoUrls(List.of("photo1.jpg"))
                .build();

        WildlifeIncident incident2 = WildlifeIncident.builder()
                .id(2L)
                .incidentType(IncidentType.ANIMAL_FOOTPRINTS)
                .latitude(6.9271)
                .longitude(79.8612)
                .description("Animal footprints found")
                .reportedAt(LocalDateTime.now())
                .status(IncidentStatus.SYNCED)
                .photoUrls(List.of())
                .build();

        when(wildlifeIncidentRepository.findAll())
                .thenReturn(List.of(incident1, incident2));

        List<WildlifeIncidentResponse> responses =
                wildlifeIncidentService.getAllIncidents();

        assertEquals(2, responses.size());
        assertEquals(1L, responses.get(0).id());
        assertEquals(2L, responses.get(1).id());

        verify(wildlifeIncidentRepository, times(1))
                .findAll();
    }

    @Test
    void shouldRetrySyncSuccessfully() {

        WildlifeIncident incident = WildlifeIncident.builder()
                .id(1L)
                .incidentType(IncidentType.SNARE)
                .latitude(7.2906)
                .longitude(80.6337)
                .description("Pending incident")
                .reportedAt(LocalDateTime.now())
                .status(IncidentStatus.SYNC_FAILED)
                .photoUrls(List.of())
                .build();

        when(wildlifeIncidentRepository.findById(1L))
                .thenReturn(Optional.of(incident));

        when(wildlifeIncidentRepository.save(any(WildlifeIncident.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WildlifeIncidentResponse response =
                wildlifeIncidentService.retrySync(1L);

        assertEquals(IncidentStatus.SYNCED, response.status());

        verify(wildlifeIncidentRepository, times(1))
                .findById(1L);

        verify(wildlifeIncidentRepository, times(1))
                .save(incident);
    }

    @Test
    void shouldPreserveMultiplePhotoUrls() {

        WildlifeIncidentRequest request =
                new WildlifeIncidentRequest(
                        IncidentType.ANIMAL_CARCASS,
                        7.2906,
                        80.6337,
                        "Animal carcass found",
                        List.of(
                                "photo1.jpg",
                                "photo2.jpg",
                                "photo3.jpg"
                        )
                );

        when(wildlifeIncidentRepository.save(any(WildlifeIncident.class)))
                .thenAnswer(invocation -> {
                    WildlifeIncident incident =
                            invocation.getArgument(0);

                    incident.setId(1L);
                    return incident;
                });

        WildlifeIncidentResponse response =
                wildlifeIncidentService.createIncident(request);

        assertEquals(3, response.photoUrls().size());
        assertTrue(response.photoUrls().contains("photo1.jpg"));
        assertTrue(response.photoUrls().contains("photo2.jpg"));
        assertTrue(response.photoUrls().contains("photo3.jpg"));
    }
}