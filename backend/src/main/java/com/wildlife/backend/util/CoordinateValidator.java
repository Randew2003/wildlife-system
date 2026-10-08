package com.wildlife.backend.util;

public final class CoordinateValidator {

    private static final double MIN_LATITUDE = -90.0;
    private static final double MAX_LATITUDE = 90.0;
    private static final double MIN_LONGITUDE = -180.0;
    private static final double MAX_LONGITUDE = 180.0;

    private CoordinateValidator() {
        // Utility class - prevent instantiation
    }

    public static void validate(
            double latitude,
            double longitude) {

        if (latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90."
            );
        }

        if (longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180."
            );
        }
    }
}