package com.payshield.common.exception;

public class DuplicateRequestException extends RuntimeException {
    private final int httpStatus;

    public DuplicateRequestException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
