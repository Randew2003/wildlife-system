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
            PatrolStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        this.patrolReference = patrolReference;
        this.rangerId = rangerId;
        this.rangerName = rangerName;
        this.routeId = routeId;
        this.routeName = routeName;
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