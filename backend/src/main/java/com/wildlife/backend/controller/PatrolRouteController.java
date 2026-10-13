package com.wildlife.backend.controller;

import com.wildlife.backend.dto.request.CreatePatrolRouteRequest;
import com.wildlife.backend.entity.PatrolRoute;
import com.wildlife.backend.repository.PatrolRouteRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patrol-routes")
public class PatrolRouteController {

    private final PatrolRouteRepository patrolRouteRepository;

    public PatrolRouteController(PatrolRouteRepository patrolRouteRepository) {
        this.patrolRouteRepository = patrolRouteRepository;
    }

    @GetMapping
    public ResponseEntity<List<PatrolRoute>> getAllRoutes() {
        return ResponseEntity.ok(patrolRouteRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<PatrolRoute> createRoute(
            @Valid @RequestBody CreatePatrolRouteRequest request) {

        patrolRouteRepository
                .findByRouteId(request.getRouteId())
                .ifPresent(route -> {
                    throw new IllegalArgumentException(
                            "Route already exists: " + request.getRouteId());
                });

        PatrolRoute route = new PatrolRoute(
                request.getRouteId().trim(),
                request.getRouteName().trim(),
                request.getDescription(),
                request.getStartLatitude(),
                request.getStartLongitude(),
                request.getEndLatitude(),
                request.getEndLongitude()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(patrolRouteRepository.save(route));
    }
}
