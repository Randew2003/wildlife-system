package com.wildlife.backend.dto.response;

import com.wildlife.backend.entity.Animal;

public class AnimalResponse {

    private Long id;
    private String animalId;
    private String species;
    private String name;
    private boolean collarActive;

    public AnimalResponse() {
    }

    public AnimalResponse(
            Long id,
            String animalId,
            String species,
            String name,
            boolean collarActive) {

        this.id = id;
        this.animalId = animalId;
        this.species = species;
        this.name = name;
        this.collarActive = collarActive;
    }

    public static AnimalResponse fromEntity(Animal animal) {

        return new AnimalResponse(
                animal.getId(),
                animal.getAnimalId(),
                animal.getSpecies(),
                animal.getName(),
                animal.isCollarActive()
        );
    }

    public Long getId() {
        return id;
    }

    public String getAnimalId() {
        return animalId;
    }

    public String getSpecies() {
        return species;
    }

    public String getName() {
        return name;
    }

    public boolean isCollarActive() {
        return collarActive;
    }
}