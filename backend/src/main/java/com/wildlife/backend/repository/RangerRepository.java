package com.wildlife.backend.repository;

import com.wildlife.backend.entity.Ranger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RangerRepository extends JpaRepository<Ranger, Long> {

    Optional<Ranger> findByRangerId(String rangerId);
}