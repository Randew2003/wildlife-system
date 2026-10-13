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

    @Column
    private Double startLatitude;

    @Column
    private Double startLongitude;

    @Column
    private Double endLatitude;

    @Column
    private Double endLongitude;

    public PatrolRoute() {
    }

    public PatrolRoute(
            String routeId,
            String routeName,
            String description) {

        this(routeId, routeName, description, null, null, null, null);
    }

    public PatrolRoute(
            String routeId,
            String routeName,
            String description,
            Double startLatitude,
            Double startLongitude,
            Double endLatitude,
            Double endLongitude) {

        this.routeId = routeId;
        this.routeName = routeName;
        this.description = description;
        this.startLatitude = startLatitude;
        this.startLongitude = startLongitude;
        this.endLatitude = endLatitude;
        this.endLongitude = endLongitude;
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

    public Double getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(Double startLatitude) {
        this.startLatitude = startLatitude;
    }

    public Double getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(Double startLongitude) {
        this.startLongitude = startLongitude;
    }

    public Double getEndLatitude() {
        return endLatitude;
    }

    public void setEndLatitude(Double endLatitude) {
        this.endLatitude = endLatitude;
    }

    public Double getEndLongitude() {
        return endLongitude;
    }

    public void setEndLongitude(Double endLongitude) {
        this.endLongitude = endLongitude;
    }
}
