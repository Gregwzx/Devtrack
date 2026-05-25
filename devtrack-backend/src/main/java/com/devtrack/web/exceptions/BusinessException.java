package com.devtrack.web.exceptions;

// exceção de regra de negócio — ex: email já cadastrado
// lançada nos use cases, capturada pelo GlobalExceptionHandler → retorna 409
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
