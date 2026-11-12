package com.payshield.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    String error,
    String message,
    Map<String, String> fieldErrors,
    String timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, null, Instant.now().toString());
    }

    public static ErrorResponse withFieldErrors(String error, String message, Map<String, String> fieldErrors) {
        return new ErrorResponse(error, message, fieldErrors, Instant.now().toString());
    }
}
