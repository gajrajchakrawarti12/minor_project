package com.backend.scheduling;

import java.util.BitSet;
import java.util.HashMap;
import java.util.Map;
import java.util.NavigableSet;

final class SchedulingState {

    final Map<Long, Integer> slotIndexById;
    final int totalSlotCount;
    final Map<Long, BitSet> usedBatchSlots = new HashMap<>();
    final Map<Long, BitSet> usedTeacherSlots = new HashMap<>();
    final Map<Long, BitSet> usedRoomSlots = new HashMap<>();
    final Map<Long, Integer> teacherLoad = new HashMap<>();
    final Map<Long, Integer> roomLoad = new HashMap<>();
    final Map<Long, int[]> batchDayLoad = new HashMap<>();
    final Map<Long, int[]> batchPracticalDayLoad = new HashMap<>();
    final Map<Long, Byte> subjectPerDayMask = new HashMap<>();
    final Map<Long, NavigableSet<Integer>[]> batchDaySlotIndexes = new HashMap<>();
    final Map<Long, Long> nonPracticalRoomByBatch = new HashMap<>();
    final Map<Long, Integer> nonPracticalRoomUsageCountByBatch = new HashMap<>();
    final Map<Long, Long> subjectTeacherByBatchSubject = new HashMap<>();
    final Map<Long, Integer> subjectTeacherUsageCount = new HashMap<>();
    public Map<Long, Long[]> batchRoomAssignments = new HashMap<>();

    SchedulingState(Map<Long, Integer> slotIndexById, int totalSlotCount) {
        this.slotIndexById = slotIndexById;
        this.totalSlotCount = totalSlotCount;
    }
}
