package com.backend.models.batch;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.backend.exceptions.DuplicateResourceException;
import com.backend.exceptions.ResourceNotFoundException;
import com.backend.models.department.DepartmentEntity;
import com.backend.models.department.DepartmentRepository;

@Service
public class BatchService {

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<BatchResponseModel> getAllBatches() {
        return batchRepository.findAll().stream().map(this::toResponse).toList();
    }

    public BatchResponseModel getBatchById(Long id) {
        BatchEntity entity = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));
        return toResponse(entity);
    }

    public BatchResponseModel createBatch(BatchRequestModel request) {
        DepartmentEntity department = getDepartmentOrThrow(request.getDepartmentId());
        String normalizedName = normalize(request.getName());

        validateUniqueBatch(normalizedName, request.getSemester(), department.getId(), null);

        BatchEntity entity = new BatchEntity();
        entity.setName(normalizedName);
        entity.setSemester(request.getSemester());
        entity.setDepartment(department);

        try {
            BatchEntity saved = batchRepository.save(entity);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException(
                    "Batch with same name already exists for the department and semester");
        }
    }

    public BatchResponseModel updateBatch(Long id, BatchRequestModel request) {
        BatchEntity existing = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));

        DepartmentEntity department = getDepartmentOrThrow(request.getDepartmentId());
        String normalizedName = normalize(request.getName());

        validateUniqueBatch(normalizedName, request.getSemester(), department.getId(), id);

        existing.setName(normalizedName);
        existing.setSemester(request.getSemester());
        existing.setDepartment(department);

        try {
            BatchEntity saved = batchRepository.save(existing);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException(
                    "Batch with same name already exists for the department and semester");
        }
    }

    public void deleteBatch(Long id) {
        if (!batchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Batch not found with id: " + id);
        }
        batchRepository.deleteById(id);
    }

    private DepartmentEntity getDepartmentOrThrow(Long departmentId) {
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + departmentId));
    }

    private void validateUniqueBatch(String name, Integer semester, Long departmentId, Long currentBatchId) {
        batchRepository.findByDepartment_IdAndSemesterAndNameIgnoreCase(departmentId, semester, name)
                .ifPresent(found -> {
            if (currentBatchId == null || !found.getId().equals(currentBatchId)) {
                throw new DuplicateResourceException(
                        "Batch with same name already exists for the department and semester");
            }
        });
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private BatchResponseModel toResponse(BatchEntity entity) {
        return new BatchResponseModel(
                entity.getId(),
                entity.getName(),
                entity.getSemester(),
                entity.getDepartment().getId());
    }
}
