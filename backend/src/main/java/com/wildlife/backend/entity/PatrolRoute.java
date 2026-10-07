package com.wildlife.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patrol_routes")
public class PatrolRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String routeId;

    @Column(nullable = false)
    private String routeName;

    @Column
    private String description;

    public PatrolRoute() {
    }

    public PatrolRoute(
            String routeId,
            String routeName,
            String description) {

        this.routeId = routeId;
        this.routeName = routeName;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}