package com.dentsbackend.controllers;

import com.dentsbackend.entities.PW;
import com.dentsbackend.entities.Tooth;
import com.dentsbackend.services.ToothService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teeth")
public class ToothController {
    @Autowired
    ToothService toothService;

    @PostMapping("/add")
    public ResponseEntity<Object> create(@RequestBody Tooth tooth){
        toothService.create(tooth);
        return ResponseEntity.ok(Map.of("message","tooth created successfully"));
    }

    @GetMapping("/all")
    public List<Tooth> getAll(){
        return toothService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable long id){
        Tooth tooth = toothService.findById(id);
        if(tooth == null)
            return new ResponseEntity<>(Map.of("message","tooth does not exist"), HttpStatus.NOT_FOUND);
        else
            return ResponseEntity.ok(tooth);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Object> update(@PathVariable long id, @RequestBody Tooth tooth){
        Tooth tooth1 = toothService.findById(id);
        if (tooth1 == null)
            return new ResponseEntity<>(Map.of("message","tooth does not exist"), HttpStatus.NOT_FOUND);
        else{
            tooth.setId(id);
            toothService.update(tooth);
            return ResponseEntity.ok(Map.of("message","tooth updated successfully"));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Object> delete(@PathVariable long id){
        Tooth tooth = toothService.findById(id);
        if (tooth == null) {
            return new ResponseEntity<>(Map.of("message", "tooth does not exist"), HttpStatus.NOT_FOUND);
        }

        List<PW> referencing = toothService.findReferencingPWs(id);
        if (!referencing.isEmpty()) {
            return buildConflictResponse(tooth, referencing);
        }

        boolean deleted = toothService.delete(tooth);
        if (!deleted) {
            List<PW> concurrentRefs = toothService.findReferencingPWs(id);
            if (!concurrentRefs.isEmpty()) {
                return buildConflictResponse(tooth, concurrentRefs);
            }
            return new ResponseEntity<>(
                    Map.of("message", "Could not delete tooth due to a database constraint or unexpected error."),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        return ResponseEntity.ok(Map.of("message", "tooth deleted successfully"));
    }

    private ResponseEntity<Object> buildConflictResponse(Tooth tooth, List<PW> referencing) {
        List<String> titles = referencing.stream()
                .map(PW::getTitle)
                .filter(Objects::nonNull)
                .toList();
        String titleList = String.join(", ", titles);
        String msg = titles.isEmpty()
                ? "Cannot delete \"" + tooth.getName() + "\" because it is referenced by existing practical work."
                : "Cannot delete \"" + tooth.getName() + "\" because it is referenced by practical work: " + titleList + ".";
        return new ResponseEntity<>(
                Map.of("message", msg, "referencingPws", titles),
                HttpStatus.CONFLICT
        );
    }
}
