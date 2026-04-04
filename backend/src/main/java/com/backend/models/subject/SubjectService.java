package com.backend.models.subject;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.backend.exceptions.DuplicateResourceException;
import com.backend.exceptions.ResourceNotFoundException;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    public List<SubjectResponseModel> getAllSubjects() {
        return subjectRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SubjectResponseModel getSubjectById(Long id) {
        SubjectEntity entity = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        return toResponse(entity);
    }

    public SubjectResponseModel createSubject(SubjectRequestModel request) {
        String normalizedName = normalize(request.getName());
        validateUniqueSubject(normalizedName, null);

        SubjectEntity entity = new SubjectEntity();
        entity.setName(normalizedName);
        entity.setLecture(request.getLecture());
        entity.setTutorial(request.getTutorial());
        entity.setPractical(request.getPractical());

        try {
            SubjectEntity saved = subjectRepository.save(entity);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Subject with same name already exists");
        }
    }

    public SubjectResponseModel updateSubject(Long id, SubjectRequestModel request) {
        SubjectEntity existing = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        String normalizedName = normalize(request.getName());
        validateUniqueSubject(normalizedName, id);

        existing.setName(normalizedName);
        existing.setLecture(request.getLecture());
        existing.setTutorial(request.getTutorial());
        existing.setPractical(request.getPractical());

        try {
            SubjectEntity saved = subjectRepository.save(existing);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Subject with same name already exists");
        }
    }

    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subject not found with id: " + id);
        }
        subjectRepository.deleteById(id);
    }

    private void validateUniqueSubject(String name, Long currentId) {
        subjectRepository.findByNameIgnoreCase(name).ifPresent(found -> {
            if (currentId == null || !found.getId().equals(currentId)) {
                throw new DuplicateResourceException("Subject name already exists");
            }
        });
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private SubjectResponseModel toResponse(SubjectEntity entity) {
        return new SubjectResponseModel(
                entity.getId(),
                entity.getName(),
                entity.getLecture(),
                entity.getTutorial(),
                entity.getPractical());
    }
}
