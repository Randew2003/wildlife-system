package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.Patrol;
import com.wildlife.backend.entity.PatrolStatus;

import java.time.LocalDateTime;

public class PatrolResponse {

    private String patrolReference;

    private String rangerId;

    private String rangerName;

    private String routeId;

    private String routeName;

    private Double routeStartLatitude;

    private Double routeStartLongitude;

    private Double routeEndLatitude;

    private Double routeEndLongitude;

    private PatrolStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    public PatrolResponse() {
    }

    public PatrolResponse(
            String patrolReference,
            String rangerId,
            String rangerName,
            String routeId,
            String routeName,
            Double routeStartLatitude,
            Double routeStartLongitude,
            Double routeEndLatitude,
            Double routeEndLongitude,
            PatrolStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        this.patrolReference = patrolReference;
        this.rangerId = rangerId;
        this.rangerName = rangerName;
        this.routeId = routeId;
        this.routeName = routeName;
        this.routeStartLatitude = routeStartLatitude;
        this.routeStartLongitude = routeStartLongitude;
        this.routeEndLatitude = routeEndLatitude;
        this.routeEndLongitude = routeEndLongitude;
        this.status = status;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public static PatrolResponse fromEntity(Patrol patrol) {

        return new PatrolResponse(
                patrol.getPatrolReference(),
                patrol.getRanger().getRangerId(),
                patrol.getRanger().getName(),
                patrol.getRoute().getRouteId(),
                patrol.getRoute().getRouteName(),
                patrol.getRoute().getStartLatitude(),
                patrol.getRoute().getStartLongitude(),
                patrol.getRoute().getEndLatitude(),
                patrol.getRoute().getEndLongitude(),
                patrol.getStatus(),
                patrol.getStartTime(),
                patrol.getEndTime()
        );
    }

    public String getPatrolReference() {
        return patrolReference;
    }

    public String getRangerId() {
        return rangerId;
    }

    public String getRangerName() {
        return rangerName;
    }

    public String getRouteId() {
        return routeId;
    }

    public String getRouteName() {
        return routeName;
    }

    public Double getRouteStartLatitude() {
        return routeStartLatitude;
    }

    public Double getRouteStartLongitude() {
        return routeStartLongitude;
    }

    public Double getRouteEndLatitude() {
        return routeEndLatitude;
    }

    public Double getRouteEndLongitude() {
        return routeEndLongitude;
    }

    public PatrolStatus getStatus() {
        return status;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }
}
