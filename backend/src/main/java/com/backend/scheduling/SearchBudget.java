package com.backend.scheduling;

final class SearchBudget {

    private final long maxStates;
    private long visitedStates;

    SearchBudget(long maxStates) {
        this.maxStates = maxStates;
    }

    boolean tryVisit() {
        if (visitedStates >= maxStates) {
            return false;
        }
        visitedStates++;
        return true;
    }
}
