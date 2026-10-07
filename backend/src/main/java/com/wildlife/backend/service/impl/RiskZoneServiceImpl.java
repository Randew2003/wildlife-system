package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.GPSLocation;
import com.wildlife.backend.entity.RiskZone;
import com.wildlife.backend.repository.RiskZoneRepository;
import com.wildlife.backend.service.interfaces.RiskZoneService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RiskZoneServiceImpl implements RiskZoneService {

    private final RiskZoneRepository riskZoneRepository;

    public RiskZoneServiceImpl(RiskZoneRepository riskZoneRepository) {
        this.riskZoneRepository = riskZoneRepository;
    }

    @Override
    public RiskZone createRiskZone(RiskZone riskZone) {
        return riskZoneRepository.save(riskZone);
    }

    @Override
    public List<RiskZone> getAllRiskZones() {
        return riskZoneRepository.findAll();
    }

    @Override
    public RiskZone getRiskZone(Long id) {
        return riskZoneRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Risk zone not found: " + id
                        ));
    }

    @Override
    public RiskZone updateRiskZone(
            Long id,
            RiskZone updatedZone) {

        RiskZone existingZone = riskZoneRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Risk zone not found: " + id
                        ));

        existingZone.setZoneName(updatedZone.getZoneName());

        existingZone.setCenterLatitude(
                updatedZone.getCenterLatitude()
        );

        existingZone.setCenterLongitude(
                updatedZone.getCenterLongitude()
        );

        existingZone.setRadiusMeters(
                updatedZone.getRadiusMeters()
        );

        existingZone.setActive(
                updatedZone.isActive()
        );

        return riskZoneRepository.save(existingZone);
    }

    @Override
    public void deleteRiskZone(Long id) {

        RiskZone existingZone = riskZoneRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Risk zone not found: " + id
                        ));

        riskZoneRepository.delete(existingZone);
    }

    @Override
    public Optional<RiskZone> findContainingZone(
            GPSLocation location) {

        List<RiskZone> activeZones =
                riskZoneRepository.findByActiveTrue();

        for (RiskZone zone : activeZones) {

            double distance = calculateDistance(
                    location.getLatitude(),
                    location.getLongitude(),
                    zone.getCenterLatitude(),
                    zone.getCenterLongitude()
            );

            if (distance <= zone.getRadiusMeters()) {
                return Optional.of(zone);
            }
        }

        return Optional.empty();
    }

    private double calculateDistance(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2) {

        final double earthRadiusMeters = 6_371_000;

        double lat1 = Math.toRadians(latitude1);
        double lat2 = Math.toRadians(latitude2);

        double deltaLat =
                Math.toRadians(latitude2 - latitude1);

        double deltaLon =
                Math.toRadians(longitude2 - longitude1);

        double a =
                Math.sin(deltaLat / 2) *
                Math.sin(deltaLat / 2)
                +
                Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(deltaLon / 2) *
                Math.sin(deltaLon / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return earthRadiusMeters * c;
    }
}