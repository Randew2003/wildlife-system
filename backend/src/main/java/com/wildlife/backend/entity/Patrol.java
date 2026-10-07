package com.wildlife.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "patrols")
public class Patrol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String patrolReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ranger_id", nullable = false)
    private Ranger ranger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private PatrolRoute route;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PatrolStatus status;

    @Column
    private LocalDateTime startTime;

    @Column
    private LocalDateTime endTime;

    public Patrol() {
    }

    public Patrol(
            String patrolReference,
            Ranger ranger,
            PatrolRoute route,
            PatrolStatus status) {

        this.patrolReference = patrolReference;
        this.ranger = ranger;
        this.route = route;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getPatrolReference() {
        return patrolReference;
    }

    public void setPatrolReference(String patrolReference) {
        this.patrolReference = patrolReference;
    }

    public Ranger getRanger() {
        return ranger;
    }

    public void setRanger(Ranger ranger) {
        this.ranger = ranger;
    }

    public PatrolRoute getRoute() {
        return route;
    }

    public void setRoute(PatrolRoute route) {
        this.route = route;
    }

    public PatrolStatus getStatus() {
        return status;
    }

    public void setStatus(PatrolStatus status) {
        this.status = status;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}