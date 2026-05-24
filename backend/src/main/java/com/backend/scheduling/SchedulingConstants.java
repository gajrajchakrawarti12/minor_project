package com.backend.scheduling;

import java.util.List;
import java.util.Map;

final class SchedulingConstants {

    static final int MAX_CLASSES_PER_DAY = 6;
    static final int MAX_RETRY_ATTEMPTS = 5;
    static final int MAX_BRANCHING_OPTIONS = 8;
    static final int MIN_BRANCHING_OPTIONS = 4;
    static final int FINAL_ATTEMPT_BRANCH_BOOST = 4;
    static final int MAX_FINAL_BRANCHING_OPTIONS = 14;
    static final long MAX_RECURSIVE_STATES_PER_ATTEMPT = 300_000L;
    static final int CHUNKED_GENERATION_THRESHOLD = 5;
    static final int SINGLE_BATCH_CHUNK_THRESHOLD = 8;
    static final int MEDIUM_BATCH_CHUNK_THRESHOLD = 6;
    static final int MAX_CHUNK_ORDER_ATTEMPTS = 6;
    static final List<Integer> PRACTICAL_SLOT_OPTIONS = List.of(3, 2, 1);

    static final int TEACHER_LOAD_WEIGHT = 10;
    static final int ROOM_LOAD_WEIGHT = 5;
    static final int DAY_LOAD_WEIGHT = 4;
    static final int FALLBACK_TEACHER_PENALTY = 20;
    static final int TEACHER_SWITCH_PENALTY = 150;
    static final int GAP_PENALTY_WEIGHT = 12;
    static final int INTERNAL_HOLE_PENALTY = 4;
    static final int SAME_SUBJECT_DAY_PENALTY = 1000;
    static final int ROOM_SWITCH_PENALTY = 25; // High enough to matter, low enough to not break the solver


    static final Map<String, Integer> DAY_ORDER = Map.of(
            "MONDAY", 1,
            "TUESDAY", 2,
            "WEDNESDAY", 3,
            "THURSDAY", 4,
            "FRIDAY", 5,
            "SATURDAY", 6,
            "SUNDAY", 7);

    private SchedulingConstants() {
    }
}
