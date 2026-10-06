package com.wildlife.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "animals")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String animalId;

    @Column(nullable = false)
    private String species;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean collarActive;

    public Animal() {
    }

    public Animal(String animalId, String species, String name, boolean collarActive) {
        this.animalId = animalId;
        this.species = species;
        this.name = name;
        this.collarActive = collarActive;
    }

    public Long getId() {
        return id;
    }

    public String getAnimalId() {
        return animalId;
    }

    public void setAnimalId(String animalId) {
        this.animalId = animalId;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isCollarActive() {
        return collarActive;
    }

    public void setCollarActive(boolean collarActive) {
        this.collarActive = collarActive;
    }
}