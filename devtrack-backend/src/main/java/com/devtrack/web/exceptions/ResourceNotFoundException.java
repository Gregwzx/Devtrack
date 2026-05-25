package com.devtrack.web.exceptions;

// exceção pra quando não acha algo no banco — retorna 404
// lançada nos use cases, capturada pelo GlobalExceptionHandler
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
