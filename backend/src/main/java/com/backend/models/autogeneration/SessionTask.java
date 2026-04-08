package com.backend.models.autogeneration;

import java.util.List;

import com.backend.models.batch.BatchEntity;
import com.backend.models.subject.SubjectEntity;
import com.backend.models.teacher.TeacherEntity;

public class SessionTask {
    private BatchEntity batch;
    private SubjectEntity subject;
    private List<TeacherEntity> teachers;
    private Long departmentId;

    public SessionTask(BatchEntity batch, SubjectEntity subject,
                       List<TeacherEntity> teachers, Long departmentId) {
        this.batch = batch;
        this.subject = subject;
        this.teachers = teachers;
        this.departmentId = departmentId;
    }

    public BatchEntity getBatch() { return batch; }
    public SubjectEntity getSubject() { return subject; }
    public List<TeacherEntity> getTeachers() { return teachers; }
    public Long getDepartmentId() { return departmentId; }
}
