package com.wildlife.backend.service.impl;

import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.repository.AnimalRepository;
import com.wildlife.backend.service.interfaces.AnimalService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnimalServiceImpl implements AnimalService {

    private final AnimalRepository animalRepository;

    public AnimalServiceImpl(AnimalRepository animalRepository) {
        this.animalRepository = animalRepository;
    }

    @Override
    public Animal createAnimal(Animal animal) {

        if (animalRepository.findByAnimalId(animal.getAnimalId()).isPresent()) {
            throw new IllegalArgumentException(
                    "Animal already exists: " + animal.getAnimalId()
            );
        }

        return animalRepository.save(animal);
    }

    @Override
    public List<Animal> getAllAnimals() {

        return animalRepository.findAll();
    }

    @Override
    public Animal getAnimal(String animalId) {

        return animalRepository.findByAnimalId(animalId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Animal not found: " + animalId
                        ));
    }

    @Override
    public Animal updateAnimal(
            String animalId,
            Animal updatedAnimal) {

        Animal existingAnimal = animalRepository.findByAnimalId(animalId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Animal not found: " + animalId
                        ));

        existingAnimal.setSpecies(updatedAnimal.getSpecies());
        existingAnimal.setName(updatedAnimal.getName());
        existingAnimal.setCollarActive(
                updatedAnimal.isCollarActive()
        );

        return animalRepository.save(existingAnimal);
    }

    @Override
    public void deleteAnimal(String animalId) {

        Animal existingAnimal = animalRepository.findByAnimalId(animalId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Animal not found: " + animalId
                        ));

        animalRepository.delete(existingAnimal);
    }
}