package com.wildlife.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "rangers")
public class Ranger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String rangerId;

    @Column(nullable = false)
    private String name;

    public Ranger() {
    }

    public Ranger(String rangerId, String name) {
        this.rangerId = rangerId;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getRangerId() {
        return rangerId;
    }

    public void setRangerId(String rangerId) {
        this.rangerId = rangerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}