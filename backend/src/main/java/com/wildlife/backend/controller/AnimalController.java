package com.wildlife.backend.controller;

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
    public ResponseEntity<Animal> createAnimal(
            @RequestBody Animal animal) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(animalService.createAnimal(animal));
    }

    @GetMapping
    public ResponseEntity<List<Animal>> getAllAnimals() {

        return ResponseEntity.ok(
                animalService.getAllAnimals()
        );
    }

    @GetMapping("/{animalId}")
    public ResponseEntity<Animal> getAnimal(
            @PathVariable String animalId) {

        return ResponseEntity.ok(
                animalService.getAnimal(animalId)
        );
    }

    @PutMapping("/{animalId}")
    public ResponseEntity<Animal> updateAnimal(
            @PathVariable String animalId,
            @RequestBody Animal animal) {

        return ResponseEntity.ok(
                animalService.updateAnimal(
                        animalId,
                        animal
                )
        );
    }

    @DeleteMapping("/{animalId}")
    public ResponseEntity<Void> deleteAnimal(
            @PathVariable String animalId) {

        animalService.deleteAnimal(animalId);

        return ResponseEntity.noContent().build();
    }
}