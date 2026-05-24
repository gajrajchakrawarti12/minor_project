package com.backend.scheduling;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import com.backend.batch.BatchEntity;
import com.backend.room.RoomEntity;
import com.backend.subject.SubjectEntity;
import com.backend.teacher.TeacherEntity;

final class SessionTask {

    private final BatchEntity batch;
    private final SubjectEntity subject;
    private final SessionType sessionType;
    private final List<TeacherCandidate> teacherCandidates;
    private final int practicalSlotLength;
    private final Set<Long> allowedDepartmentIds;
    private final List<RoomEntity> cachedPracticalRooms;

    SessionTask(
            BatchEntity batch,
            SubjectEntity subject,
            SessionType sessionType,
            List<TeacherEntity> specializedTeachers,
            List<TeacherEntity> fallbackTeachers,
            int practicalSlotLength,
            Set<Long> allowedDepartmentIds,
            List<RoomEntity> practicalRooms) {
        this.batch = batch;
        this.subject = subject;
        this.sessionType = sessionType;
        this.practicalSlotLength = practicalSlotLength;
        this.allowedDepartmentIds = Set.copyOf(allowedDepartmentIds);
        this.cachedPracticalRooms = practicalRooms == null ? null : List.copyOf(practicalRooms);

        List<TeacherCandidate> candidates = new ArrayList<>();
        for (TeacherEntity teacher : specializedTeachers) {
            candidates.add(new TeacherCandidate(teacher, false));
        }
        for (TeacherEntity teacher : fallbackTeachers) {
            candidates.add(new TeacherCandidate(teacher, true));
        }
        candidates.sort(Comparator.comparing(candidate -> candidate.teacher().getId()));
        this.teacherCandidates = List.copyOf(candidates);
    }

    BatchEntity getBatch() {
        return batch;
    }

    SubjectEntity getSubject() {
        return subject;
    }

    SessionType getSessionType() {
        return sessionType;
    }

    List<TeacherCandidate> getTeacherCandidates() {
        return teacherCandidates;
    }

    int getPracticalSlotLength() {
        return practicalSlotLength;
    }

    Set<Long> getAllowedDepartmentIds() {
        return allowedDepartmentIds;
    }

    List<RoomEntity> getCachedPracticalRooms() {
        return cachedPracticalRooms;
    }

    int teacherPoolSize() {
        return teacherCandidates.size();
    }

    int minRequiredSlots() {
        if (sessionType != SessionType.PRACTICAL) {
            return 1;
        }
        return practicalSlotLength > 0 ? practicalSlotLength : 2;
    }
}
