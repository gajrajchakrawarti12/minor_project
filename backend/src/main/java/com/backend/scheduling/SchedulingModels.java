package com.backend.scheduling;

import java.util.List;
import java.util.Map;

import com.backend.room.RoomEntity;
import com.backend.teacher.TeacherEntity;
import com.backend.timeslot.TimeSlotEntity;

enum SessionType {
    LECTURE,
    TUTORIAL,
    PRACTICAL
}

record AssignmentOption(
        TeacherEntity teacher,
        RoomEntity room,
        SlotGroup slotGroup,
        int score,
        boolean usesFallbackTeacher) {
}

record SlotGroup(
        List<TimeSlotEntity> slots,
        int[] slotIndexes,
        int dayIndex,
        int length) {
}

record PracticalPlan(int sessionCount, List<Integer> slotLengths) {
}

record TeacherCandidate(TeacherEntity teacher, boolean fallback) {
}

record SlotPair(Long left, Long right) {
}

record PrecomputedSlots(
        Map<Long, Integer> slotIndexById,
        Map<Long, List<SlotGroup>> singleSlotGroupsByStartSlotId,
        Map<Long, List<SlotGroup>> practicalGroupsByStartSlotId,
        Map<Long, Map<Integer, List<SlotGroup>>> practicalGroupsByStartSlotAndLength,
        List<Long> startSlotIds,
        List<RoomEntity> labRooms,
        List<RoomEntity> nonLabRooms,
        Map<Long, RoomEntity> nonLabRoomById) {
}
