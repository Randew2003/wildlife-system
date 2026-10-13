package com.wildlife.backend.repository;

import com.wildlife.backend.entity.GPSLocation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GPSLocationRepository extends JpaRepository<GPSLocation, Long> {

    @EntityGraph(attributePaths = {"animal"})
    List<GPSLocation> findByAnimalAnimalIdOrderByRecordedAtDesc(String animalId);
}
