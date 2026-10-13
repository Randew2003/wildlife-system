package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.AddWaypointRequest;
import com.wildlife.backend.dto.request.AssignPatrolRequest;
import com.wildlife.backend.dto.request.RecordLocationRequest;
import com.wildlife.backend.dto.response.PatrolLocationResponse;
import com.wildlife.backend.dto.response.PatrolResponse;
import com.wildlife.backend.dto.response.WaypointResponse;
import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolLocation;
import com.wildlife.backend.entity.PatrolRoute;
import com.wildlife.backend.entity.PatrolStatus;
import com.wildlife.backend.entity.Ranger;
import com.wildlife.backend.entity.UserRole;
import com.wildlife.backend.entity.Waypoint;
import com.wildlife.backend.repository.PatrolRepository;
import com.wildlife.backend.repository.PatrolRouteRepository;
import com.wildlife.backend.repository.RangerRepository;
import com.wildlife.backend.repository.UserAccountRepository;
import com.wildlife.backend.service.interfaces.PatrolLocationService;
import com.wildlife.backend.service.interfaces.PatrolService;
import com.wildlife.backend.service.interfaces.WaypointService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patrols")
public class PatrolController {

    private final PatrolService patrolService;
    private final PatrolLocationService patrolLocationService;
    private final WaypointService waypointService;
    private final PatrolRepository patrolRepository;
    private final RangerRepository rangerRepository;
    private final PatrolRouteRepository patrolRouteRepository;
    private final UserAccountRepository userAccountRepository;

    public PatrolController(
            PatrolService patrolService,
            PatrolLocationService patrolLocationService,
            WaypointService waypointService,
            PatrolRepository patrolRepository,
            RangerRepository rangerRepository,
            PatrolRouteRepository patrolRouteRepository,
            UserAccountRepository userAccountRepository) {

        this.patrolService = patrolService;
        this.patrolLocationService = patrolLocationService;
        this.waypointService = waypointService;
        this.patrolRepository = patrolRepository;
        this.rangerRepository = rangerRepository;
        this.patrolRouteRepository = patrolRouteRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public ResponseEntity<List<PatrolResponse>> getAllPatrols() {

        List<PatrolResponse> response = patrolRepository
                .findAll()
                .stream()
                .map(PatrolResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PatrolResponse> assignPatrol(
            @Valid @RequestBody AssignPatrolRequest request) {

        if (!userAccountRepository.existsByRangerIdAndRoleAndEnabledTrue(
                request.getRangerId(),
                UserRole.RANGER)) {

            throw new IllegalArgumentException(
                    "Active ranger account not found: " + request.getRangerId());
        }

        Ranger ranger = rangerRepository
                .findByRangerId(request.getRangerId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Ranger not found: " + request.getRangerId()));

        PatrolRoute route = patrolRouteRepository
                .findByRouteId(request.getRouteId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Route not found: " + request.getRouteId()));

        String patrolReference = request.getPatrolReference();

        if (patrolReference == null || patrolReference.isBlank()) {
            patrolReference = "PAT-" + UUID.randomUUID();
        }

        Patrol patrol = new Patrol(
                patrolReference,
                ranger,
                route,
                PatrolStatus.ASSIGNED
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(PatrolResponse.fromEntity(
                        patrolRepository.save(patrol)));
    }

    @GetMapping("/assigned/{rangerId}")
    public ResponseEntity<List<PatrolResponse>> getAssignedPatrols(
            @PathVariable Long rangerId) {

        List<PatrolResponse> response = patrolService
                .getAssignedPatrols(rangerId)
                .stream()
                .map(PatrolResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{patrolReference}")
    public ResponseEntity<PatrolResponse> getPatrol(
            @PathVariable String patrolReference) {

        PatrolResponse response = PatrolResponse.fromEntity(
                patrolService.getPatrolByReference(patrolReference)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{patrolReference}/start")
    public ResponseEntity<PatrolResponse> startPatrol(
            @PathVariable String patrolReference) {

        PatrolResponse response = PatrolResponse.fromEntity(
                patrolService.startPatrol(patrolReference)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{patrolReference}/locations")
    public ResponseEntity<PatrolLocationResponse> recordLocation(
            @PathVariable String patrolReference,
            @Valid @RequestBody RecordLocationRequest request) {

        PatrolLocation location = patrolLocationService.recordLocation(
                patrolReference,
                request.getLatitude(),
                request.getLongitude()
        );

        PatrolLocationResponse response =
                PatrolLocationResponse.fromEntity(location);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{patrolReference}/locations")
    public ResponseEntity<List<PatrolLocationResponse>> getPatrolLocations(
            @PathVariable String patrolReference) {

        List<PatrolLocationResponse> response =
                patrolLocationService
                        .getPatrolLocations(patrolReference)
                        .stream()
                        .map(PatrolLocationResponse::fromEntity)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{patrolReference}/waypoints")
    public ResponseEntity<WaypointResponse> addWaypoint(
            @PathVariable String patrolReference,
            @Valid @RequestBody AddWaypointRequest request) {

        Waypoint waypoint = waypointService.addWaypoint(
                patrolReference,
                request.getLatitude(),
                request.getLongitude(),
                request.getNote()
        );

        WaypointResponse response =
                WaypointResponse.fromEntity(waypoint);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{patrolReference}/waypoints")
    public ResponseEntity<List<WaypointResponse>> getPatrolWaypoints(
            @PathVariable String patrolReference) {

        List<WaypointResponse> response =
                waypointService
                        .getPatrolWaypoints(patrolReference)
                        .stream()
                        .map(WaypointResponse::fromEntity)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{patrolReference}/complete")
    public ResponseEntity<PatrolResponse> completePatrol(
            @PathVariable String patrolReference) {

        PatrolResponse response = PatrolResponse.fromEntity(
                patrolService.completePatrol(patrolReference)
        );

        return ResponseEntity.ok(response);
    }
}
