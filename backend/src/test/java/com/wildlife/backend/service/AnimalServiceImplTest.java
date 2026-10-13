package com.wildlife.backend.service;

import com.wildlife.backend.entity.Animal;
import com.wildlife.backend.repository.AnimalRepository;
import com.wildlife.backend.service.impl.AnimalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnimalServiceImplTest {

    @Mock
    private AnimalRepository animalRepository;

    private AnimalServiceImpl animalService;

    @BeforeEach
    void setUp() {
        animalService =
                new AnimalServiceImpl(animalRepository);
    }

    @Test
    void shouldCreateAnimalSuccessfully() {

        Animal animal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.empty());

        when(animalRepository.save(any(Animal.class)))
                .thenReturn(animal);

        Animal result =
                animalService.createAnimal(animal);

        assertNotNull(result);
        assertEquals("ELE-TEST-001", result.getAnimalId());
        assertEquals("Elephant", result.getSpecies());
        assertEquals("Kandula", result.getName());
        assertTrue(result.isCollarActive());

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");

        verify(animalRepository, times(1))
                .save(animal);
    }

    @Test
    void shouldThrowExceptionForDuplicateAnimal() {

        Animal existingAnimal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.of(existingAnimal));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> animalService.createAnimal(existingAnimal)
                );

        assertEquals(
                "Animal already exists: ELE-TEST-001",
                exception.getMessage()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");

        verify(animalRepository, never())
                .save(any(Animal.class));
    }

    @Test
    void shouldGetAnimalSuccessfully() {

        Animal animal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.of(animal));

        Animal result =
                animalService.getAnimal("ELE-TEST-001");

        assertNotNull(result);
        assertEquals(
                "ELE-TEST-001",
                result.getAnimalId()
        );
        assertEquals("Kandula", result.getName());

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");
    }

    @Test
    void shouldThrowExceptionWhenAnimalNotFound() {

        when(animalRepository.findByAnimalId("INVALID-ANIMAL"))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> animalService.getAnimal("INVALID-ANIMAL")
                );

        assertEquals(
                "Animal not found: INVALID-ANIMAL",
                exception.getMessage()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("INVALID-ANIMAL");
    }

    @Test
    void shouldGetAllAnimalsSuccessfully() {

        Animal animal1 = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        Animal animal2 = new Animal(
                "LEO-TEST-001",
                "Leopard",
                "Leo",
                true
        );

        when(animalRepository.findAll())
                .thenReturn(List.of(animal1, animal2));

        List<Animal> result =
                animalService.getAllAnimals();

        assertNotNull(result);
        assertEquals(2, result.size());

        assertEquals(
                "ELE-TEST-001",
                result.get(0).getAnimalId()
        );

        assertEquals(
                "LEO-TEST-001",
                result.get(1).getAnimalId()
        );

        verify(animalRepository, times(1))
                .findAll();
    }

    @Test
    void shouldUpdateAnimalSuccessfully() {

        Animal existingAnimal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        Animal updatedAnimal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "New Kandula",
                false
        );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.of(existingAnimal));

        when(animalRepository.save(any(Animal.class)))
                .thenReturn(existingAnimal);

        Animal result =
                animalService.updateAnimal(
                        "ELE-TEST-001",
                        updatedAnimal
                );

        assertNotNull(result);
        assertEquals(
                "New Kandula",
                result.getName()
        );
        assertFalse(result.isCollarActive());

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");

        verify(animalRepository, times(1))
                .save(existingAnimal);
    }

    @Test
    void shouldDeleteAnimalSuccessfully() {

        Animal existingAnimal = new Animal(
                "ELE-TEST-001",
                "Elephant",
                "Kandula",
                true
        );

        when(animalRepository.findByAnimalId("ELE-TEST-001"))
                .thenReturn(Optional.of(existingAnimal));

        animalService.deleteAnimal("ELE-TEST-001");

        verify(animalRepository, times(1))
                .findByAnimalId("ELE-TEST-001");

        verify(animalRepository, times(1))
                .delete(existingAnimal);
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistingAnimal() {

        when(animalRepository.findByAnimalId("INVALID-ANIMAL"))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> animalService.deleteAnimal("INVALID-ANIMAL")
                );

        assertEquals(
                "Animal not found: INVALID-ANIMAL",
                exception.getMessage()
        );

        verify(animalRepository, times(1))
                .findByAnimalId("INVALID-ANIMAL");

        verify(animalRepository, never())
                .delete(any(Animal.class));
    }
}