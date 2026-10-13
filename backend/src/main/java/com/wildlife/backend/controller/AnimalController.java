package com.wildlife.backend.controller;

import com.wildlife.backend.dto.response.AnimalResponse;
import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.service.interfaces.AnimalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/animals")
public class AnimalController {

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    @PostMapping
    public ResponseEntity<AnimalResponse> createAnimal(
            @RequestBody Animal animal) {

        Animal savedAnimal = animalService.createAnimal(animal);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AnimalResponse.fromEntity(savedAnimal));
    }

    @GetMapping
    public ResponseEntity<List<AnimalResponse>> getAllAnimals() {

        List<AnimalResponse> responses =
                animalService.getAllAnimals()
                        .stream()
                        .map(AnimalResponse::fromEntity)
                        .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{animalId}")
    public ResponseEntity<AnimalResponse> getAnimal(
            @PathVariable String animalId) {

        Animal animal = animalService.getAnimal(animalId);

        return ResponseEntity.ok(
                AnimalResponse.fromEntity(animal)
        );
    }

    @PutMapping("/{animalId}")
    public ResponseEntity<AnimalResponse> updateAnimal(
            @PathVariable String animalId,
            @RequestBody Animal animal) {

        Animal updatedAnimal =
                animalService.updateAnimal(
                        animalId,
                        animal
                );

        return ResponseEntity.ok(
                AnimalResponse.fromEntity(updatedAnimal)
        );
    }

    @DeleteMapping("/{animalId}")
    public ResponseEntity<Void> deleteAnimal(
            @PathVariable String animalId) {

        animalService.deleteAnimal(animalId);

        return ResponseEntity.noContent().build();
    }
}