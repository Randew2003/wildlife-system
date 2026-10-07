package com.wildlife.backend.service.interfaces;

import com.wildlife.backend.entity.Animal;

import java.util.List;

public interface AnimalService {

    Animal createAnimal(Animal animal);

    List<Animal> getAllAnimals();

    Animal getAnimal(String animalId);

    Animal updateAnimal(String animalId, Animal animal);

    void deleteAnimal(String animalId);
}