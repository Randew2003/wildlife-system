package com.wildlife.backend.repository;

import com.wildlife.backend.entity.PatrolRoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatrolRouteRepository extends JpaRepository<PatrolRoute, Long> {

    Optional<PatrolRoute> findByRouteId(String routeId);
}