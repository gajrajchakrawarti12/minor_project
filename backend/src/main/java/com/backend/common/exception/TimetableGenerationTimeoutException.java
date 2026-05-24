package com.backend.common.exception;

public class TimetableGenerationTimeoutException extends RuntimeException {
    public TimetableGenerationTimeoutException(String message) {
        super(message);
    }
}
